import { log, BigInt, BigDecimal,Address } from '@graphprotocol/graph-ts';
import { Asset, User,Transaction,IDGenerator } from "../../generated/schema";
import {
  Transfer,
  Pols
} from '../../generated/Pols/Pols';

let zeroBD = BigDecimal.fromString('0')
const generaterID = "GENERATOR"

function getID(): BigInt {
  let generator = IDGenerator.load(generaterID)
  if (generator == null) {
    generator = new IDGenerator(generaterID)
    generator.aID = BigInt.fromI32(0)
    generator.save()
    return generator.aID
  }
  else{
    generator.aID =  generator.aID + BigInt.fromI32(1) 
    generator.save()
    return generator.aID
  }
}

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
  let contract = Pols.bind(Address.fromString(assetAddress))
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

function createTransaction(userID: string, tokenID:string,event:Transfer,direction:string): Transaction{
  let transaction = new Transaction(userID.concat('-').concat(tokenID).concat('-').concat(event.block.timestamp.toString()).concat(direction))
  transaction.tokenID = userID.concat('-').concat(tokenID)
  log.info("Transaction created", [])  
  return transaction
}
function createAssetforUser(userID: string, tokenID:string): Asset {
  let asset = new Asset(userID.concat('-').concat(tokenID))
  let aid:BigInt = getID()
  let contract =  Pols.bind(Address.fromString(tokenID))
  asset.decimals = contract.decimals() ? contract.decimals() : null
  asset.name = contract.name() ? contract.name() : null
  asset.symbol = contract.symbol() ? contract.symbol() : null
  asset.balance = zeroBD
  asset.owner = userID
  asset.maxBalance = zeroBD
  asset.amountIn = zeroBD
  asset.amountOut = zeroBD
  asset.amountTotal = zeroBD
  asset.amountAver = zeroBD
  asset.countIn = BigInt.fromI32(0)
  asset.countOut = BigInt.fromI32(0)
  asset.countTotal = BigInt.fromI32(0)
  asset.contractAddress = tokenID
  asset.walletAddress = userID
  asset.aID = aid
  log.info("Asset created", [])  
  return asset
}


export function handleTransfer(event: Transfer): void {
  let userFromID = event.params.from.toHex()
  let userToID = event.params.to.toHex()
  let tokenID = event.address.toHexString()
  let assetID = userToID.concat('-').concat(tokenID)
  const sDirectionOut = "out"
  const sDirectionIn = "in"

  // caculate the balance for from user
  if (userFromID != tokenID) {

    let UserFrom = User.load(userFromID)
    if (UserFrom == null) {
      UserFrom = createUser(userFromID)
    }

    let UserStatsFrom = Asset.load(userFromID.concat('-').concat(tokenID))
    if (UserStatsFrom == null) {
      UserStatsFrom = createAssetforUser(userFromID, tokenID)
    }
    let AssetDecimals = UserStatsFrom.decimals
    let AssetDecimalsBD: BigDecimal = exponentToBigDecimal(AssetDecimals)
    UserStatsFrom.balance = UserStatsFrom.balance.minus(
      event.params.value
        .toBigDecimal()
        .div(AssetDecimalsBD)
        .truncate(AssetDecimals),
    )
    //caculate the max balance for from user
    if(UserStatsFrom.maxBalance < UserStatsFrom.balance ){
      UserStatsFrom.maxBalance = UserStatsFrom.balance
    }
    //caculate the number of transfer, amount ===> out direction 
    UserStatsFrom.countOut = UserStatsFrom.countOut + BigInt.fromI32(1)
    UserStatsFrom.countTotal = UserStatsFrom.countTotal + BigInt.fromI32(1)
    UserStatsFrom.amountOut = UserStatsFrom.amountOut.plus(
      event.params.value
        .toBigDecimal()
        .div(AssetDecimalsBD)
        .truncate(AssetDecimals),
    )
    UserStatsFrom.amountTotal = UserStatsFrom.amountTotal.plus(
      event.params.value
        .toBigDecimal()
        .div(AssetDecimalsBD)
        .truncate(AssetDecimals),
    )
    //caculate the average amount per transfer
    UserStatsFrom.amountAver = UserStatsFrom.amountTotal.div(UserStatsFrom.countTotal.toBigDecimal())
    
    //record the transaction detail
    let UserTransactionFrom = createTransaction(userFromID,tokenID,event,sDirectionOut)
    UserTransactionFrom.date = event.block.timestamp
    UserTransactionFrom.amount = event.params.value
    .toBigDecimal()
    .div(AssetDecimalsBD)
    .truncate(AssetDecimals)
    UserTransactionFrom.direction = sDirectionOut
    UserTransactionFrom.owner = userFromID
    UserTransactionFrom.hash = event.block.hash
    log.info("Transaction finished", [])  
    UserTransactionFrom.balance = UserStatsFrom.balance
    UserTransactionFrom.from = userFromID
    UserTransactionFrom.to = userToID

    UserStatsFrom.save()
    UserTransactionFrom.save()
  }



  // caculate the balance for to user
 if (userToID != tokenID) {
  let UserTo = User.load(userToID)
  if (UserTo == null) {
    UserTo = createUser(userToID)
  }
   let UserStatsTo = Asset.load(userToID.concat('-').concat(tokenID))
   if (UserStatsTo == null) {
     UserStatsTo = createAssetforUser(userToID, tokenID)
   }
   let AssetDecimals = UserStatsTo.decimals
   let AssetDecimalsBD: BigDecimal = exponentToBigDecimal(AssetDecimals)
   UserStatsTo.balance = UserStatsTo.balance.plus(
     event.params.value
       .toBigDecimal()
       .div(AssetDecimalsBD)
       .truncate(AssetDecimals),
   )
   //caculate the max balance for to user
   if(UserStatsTo.maxBalance < UserStatsTo.balance ){
    UserStatsTo.maxBalance = UserStatsTo.balance
  }
   //caculate the number of transfer, amount ===> in direction 
    UserStatsTo.countIn = UserStatsTo.countIn + BigInt.fromI32(1)
    UserStatsTo.countTotal = UserStatsTo.countTotal + BigInt.fromI32(1)
    UserStatsTo.amountIn = UserStatsTo.amountIn.plus(
        event.params.value
          .toBigDecimal()
          .div(AssetDecimalsBD)
          .truncate(AssetDecimals),
    )
    UserStatsTo.amountTotal = UserStatsTo.amountTotal.plus(
        event.params.value
          .toBigDecimal()
          .div(AssetDecimalsBD)
          .truncate(AssetDecimals),
    )
    //caculate the average amount per transfer
    UserStatsTo.amountAver = UserStatsTo.amountTotal.div(UserStatsTo.countTotal.toBigDecimal())
    
    //record the transaction detail
    let UserTransactionIn = createTransaction(userToID,tokenID,event,sDirectionIn)
    UserTransactionIn.date = event.block.timestamp
    UserTransactionIn.amount = event.params.value
    .toBigDecimal()
    .div(AssetDecimalsBD)
    .truncate(AssetDecimals)
    UserTransactionIn.direction = sDirectionIn
    UserTransactionIn.owner = userToID
    UserTransactionIn.hash = event.block.hash
    UserTransactionIn.balance = UserStatsTo.balance
    UserTransactionIn.from = userFromID
    UserTransactionIn.to = userToID

    UserTransactionIn.save()
    UserStatsTo.save() 

  

}
}
