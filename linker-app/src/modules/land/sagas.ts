import { call, put, takeLatest, takeEvery } from 'redux-saga/effects'
import { contracts, eth } from 'decentraland-eth'
import { CONNECT_WALLET_SUCCESS } from 'decentraland-dapps/dist/modules/wallet/actions'

import {
  FETCH_LAND_REQUEST,
  FetchLandRequestAction,
  fetchLandSuccess,
  fetchLandFailure,
  SIGN_CONTENT_REQUEST,
  SignContentRequestAction,
  signContentSuccess,
  signContentFailure,
  fetchLandRequest,
  SignContentSuccessAction,
  SIGN_CONTENT_SUCCESS
} from './actions'
import { baseParcel } from '../config'
import { LANDRegistry } from '../../contracts'
import { Coords } from './types'
import { getEmptyLandData } from './utils'
import { closeServer } from '../server/utils'

export function* landSaga() {
  yield takeEvery(FETCH_LAND_REQUEST, handleFetchLandRequest)
  yield takeEvery(CONNECT_WALLET_SUCCESS, handleConnectWalletSuccess)
  yield takeLatest(SIGN_CONTENT_REQUEST, handleSignContentRequest)
  yield takeEvery(SIGN_CONTENT_SUCCESS, handleSignContentSuccess)
}

function* handleFetchLandRequest(action: FetchLandRequestAction) {
  try {
    const { x, y } = action.payload as Coords
    const data = yield call(() => LANDRegistry['landData'](x, y))
    const land = data ? contracts.LANDRegistry.decodeLandData(data) : getEmptyLandData()
    yield put(fetchLandSuccess(land))
  } catch (error) {
    yield put(fetchLandFailure(error.message))
  }
}

function* handleConnectWalletSuccess() {
  yield put(fetchLandRequest(baseParcel))
}

function* handleSignContentRequest(action: SignContentRequestAction) {
  try {
    const hashToSign = action.payload
    const signedMessage = yield call(() => {
      return eth.wallet.sign(hashToSign)
    })
    yield put(signContentSuccess(signedMessage))
  } catch (error) {
    yield put(signContentFailure(error.message))
  }
}

function* handleSignContentSuccess(action: SignContentSuccessAction) {
  const address = eth.wallet.getAccount()

  try {
    yield call(() => {
      closeServer(true, JSON.stringify({ signature: action.payload, address }))
    })
  } catch (error) {
    yield put(signContentFailure(error.message))
  }
}
