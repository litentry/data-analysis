import { log, BigInt, BigDecimal,Address } from '@graphprotocol/graph-ts';
import { Asset, User } from "../../generated/schema";
import {
  Transfer,
  Litentry
} from '../../generated/Litentry/Litentry';

let zeroBD = BigDecimal.fromString('0')

function createUser(
  userId: string
): User {
  let UserStats = new User(userId)
  UserStats.save()
  log.info("User created", [])
  return UserStats as User
}

function createAsset(assetAddress: string): Asset {
  let asset = new Asset(assetAddress)
  // Can call the read-only functions of an ERC20 contract with below bind
  let contract = Litentry.bind(Address.fromString(assetAddress))
  asset.decimals = contract.decimals() ? contract.decimals() : null
  asset.name = contract.name() ? contract.name() : null
  asset.symbol = contract.symbol() ? contract.symbol() : null
  return asset
}

function exponentToBigDecimal(decimals: i32): BigDecimal {
  let bd = BigDecimal.fromString('1')
  for (let i = 0; i < decimals; i++) {
    bd = bd.times(BigDecimal.fromString('10'))
  }
  return bd
}

function createAssetforUser(userID: string, tokenID:string): Asset {
  let asset = new Asset(userID.concat('-').concat(tokenID))
  let contract =  Litentry.bind(Address.fromString(tokenID))
  asset.decimals = contract.decimals() ? contract.decimals() : null
  asset.name = contract.name() ? contract.name() : null
  asset.symbol = contract.symbol() ? contract.symbol() : null
  asset.balance = zeroBD
  asset.owner = userID
  asset.maxBalance = zeroBD
  log.info("Asset created", [])  
  return asset
}


export function handleTransfer(event: Transfer): void {
  let userFromID = event.params.from.toHex()
  let userToID = event.params.to.toHex()
  let tokenID = event.address.toHexString()
  let assetID = userToID.concat('-').concat(tokenID)
  
  
  let asset = Asset.load(assetID)
  if (asset == null) {
    asset = createAssetforUser(userToID, tokenID)
  }
  let AssetDecimals = asset.decimals
  let AssetDecimalsBD: BigDecimal = exponentToBigDecimal(AssetDecimals)

  // caculate the balance for to user

  if (userFromID != tokenID) {
    let UserFrom = User.load(userFromID)
    if (UserFrom == null) {
      UserFrom = createUser(userFromID)
    }
    let UserStatsFrom = Asset.load(userFromID.concat('-').concat(tokenID))
    if (UserStatsFrom == null) {
      UserStatsFrom = createAssetforUser(userFromID, tokenID)
    }
    UserStatsFrom.balance = UserStatsFrom.balance.minus(
      event.params.value
        .toBigDecimal()
        .div(AssetDecimalsBD)
        .truncate(AssetDecimals),
    )
    if(UserStatsFrom.maxBalance < UserStatsFrom.balance ){
      UserStatsFrom.maxBalance = UserStatsFrom.balance
    }
    UserStatsFrom.save()
  }
  // caculate the balance for from user
 if (userToID != tokenID) {
  let UserTo = User.load(userToID)
  if (UserTo == null) {
    UserTo = createUser(userToID)
  }
   let UserStatsTo = Asset.load(userToID.concat('-').concat(tokenID))
   if (UserStatsTo == null) {
     UserStatsTo = createAssetforUser(userToID, tokenID)
   }
   UserStatsTo.balance = UserStatsTo.balance.plus(
     event.params.value
       .toBigDecimal()
       .div(AssetDecimalsBD)
       .truncate(AssetDecimals),
   )
   if(UserStatsTo.maxBalance < UserStatsTo.balance ){
    UserStatsTo.maxBalance = UserStatsTo.balance
  }
   UserStatsTo.save()

}
}
