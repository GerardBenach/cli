import { ContentUploadRequest } from "./ContentUploadRequest"
import { fail } from "assert"
import { Coords } from "src/utils/coordinateHelpers"

const request = require('request')

export type ParcelInformation = {
  parcel_id: string,
  contents: Map<string, string>,
  root_cid: string,
  publisher: string
}

export type MappingsResponse = {
  ok: boolean,
  data: ParcelInformation [],
  errorMessage?: string
}

export class ContentClient {
  contentServerUrl: string

  constructor(_contentServerUrl: string) {
    this.contentServerUrl = _contentServerUrl
  }

  /**
   * Send the content in the request to the conetnt server
   * @param uploadRequest
   */
  async uploadContent(uploadRequest: ContentUploadRequest): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      request.post({ url: `${this.contentServerUrl}/mappings`, formData: uploadRequest.requestContent() }, function optionalCallback(err, httpResponse, body) {
        if (err) {
          fail(err)
        }
        const result = httpResponse.toJSON()
        resolve(result)
      }
    )
    })
  }

  /**
   * Returns all the scenes related to all the parcels in the square specified by the x1,y1,x2,y2 coordinates.
   * It should include estates that are partially within the constraints of the provided range
   * @param from
   * @param to
   */
  async getParcelsInformation(from: Coords, to: Coords): Promise<MappingsResponse> {
    return new Promise<MappingsResponse>((resolve, reject) => {
      const params = { nw: `${from.x},${from.y}`, se: `${to.x},${to.y}` }
      request({ url: `${this.contentServerUrl}/mappings`, qs: params }, function(err, response) {
        if (err) {
          fail(err)
        }
        const result = response.toJSON()
        if (result.statusCode === 200) {
          const body = JSON.parse(result.body)
          resolve({ ok: true, data: body == null ? [] : body })
        } else {
          resolve({ ok: false, data: [], errorMessage: result.body })
        }
      })
    })
  }

  async getContent(cid: string): Promise<any> {
    return new Promise<MappingsResponse>((resolve, reject) => {
      request({ url: `${this.contentServerUrl}/contents/${cid}` }, function(err, response) {
        if (err) {
          fail(err)
        }
        resolve(response.toJSON())
      })
    })
  }

}
