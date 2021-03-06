import { expect } from 'chai'
import { sandbox } from 'sinon'

import { Decentraland } from '../../../src/lib/Decentraland'
import { Ethereum } from '../../../src/lib/Ethereum'
import { Project } from '../../../src/lib/Project'
import * as ProjectUtils from '../../../src/utils/project'
import { ContentService } from '../../../src/lib/content/ContentService'

const ctx = sandbox.create()

/**
 * Why these tests are cool:
 * - We test the order in which methods are called, which is actually part of the business logic
 * - We test the arguments which are passed to the methods, which verifies the data flow
 * - Everything is mocked and test only cover the purposed mentioned above
 *
 * But integration tests!
 *
 * Integration tests are awesome but they lack the granularity to validate each one of the steps.
 * They are black box tests and they are simply not enough. That being said, these tests are only
 * useful when used along black-box integration tests, so keep an eye on those!
 */

describe('Decentraland', () => {
  let validateSceneOptionsStub
  let getOwnerStub
  let getParcelsStub
  let validateAuthorizationStub
  let getFilesStub
  let linkStub
  let uploadContentStub

  const address = '0x8Bed95D830475691C10281f1FeA2c0a0fE51304B'
  const projectSignature =
    '0x9adcd58e1d65aeb9d92cb25f59a1f9d1c19d9935534c91e59057135b2ecf020e3e56476788cee00bd4a8aa62602af307851276ee4b97be4832fbc541b24f0d141c'

  const addFilesResult = beforeEach(() => {
    // Ethereum stubs
    validateAuthorizationStub = ctx.stub(Ethereum.prototype, 'validateAuthorization').callsFake(() => undefined)

    // Project stubs
    ctx.stub(Project.prototype, 'validateExistingProject').callsFake(() => undefined)
    validateSceneOptionsStub = ctx.stub(Project.prototype, 'validateSceneOptions').callsFake(() => undefined)
    ctx.stub(Project.prototype, 'getParcelCoordinates').callsFake(() => ({ x: 0, y: 0 }))
    getOwnerStub = ctx.stub(Project.prototype, 'getOwner').callsFake(() => address)
    getParcelsStub = ctx.stub(Project.prototype, 'getParcels').callsFake(() => ({ x: 0, y: 0 }))
    getFilesStub = ctx.stub(Project.prototype, 'getFiles').callsFake(() => [{ path: '/tmp/myFile.txt', content: null }])

    // ContentServicestubs
    uploadContentStub = ctx.stub(ContentService.prototype, 'uploadContent').callsFake(() => true)

    // Decentraland stubs
    linkStub = ctx.stub(Decentraland.prototype, 'link').callsFake(() => `{"signature":"${projectSignature}","address":"${address}"}`)
    // Utils stub
    var stub = ctx.stub(ProjectUtils, 'getRootPath').callsFake(() => '.')
  })

  afterEach(() => {
    // completely restore all fakes created through the sandbox
    ctx.restore()
  })

  describe('deploy()', () => {
    it('should call all the necessary APIs', async () => {
      const dcl = new Decentraland()
      const files = await dcl.project.getFiles()
      await dcl.deploy(files)

      expect(validateAuthorizationStub.called, 'expect Ethereum.validateAuthorization() to be called').to.be.true
      expect(getFilesStub.called, 'expect Project.getFiles() to be called').to.be.true
      expect(validateSceneOptionsStub.called, 'expect Project.validateParcelOptions() to be called').to.be.true
      expect(getOwnerStub.called, 'expect Project.getOwner() to be called').to.be.true
      expect(getParcelsStub.called, 'expect Project.getParcels() to be called').to.be.true
      expect(linkStub.calledBefore(uploadContentStub), 'expect Decentraland.link() to be called').to.be.true
      expect(uploadContentStub.called).to.be.true
    })
  })
})
