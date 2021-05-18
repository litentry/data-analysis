import { Birth, Transfer, CryptoKitties } from '../generated/CryptoKitties/CryptoKitties'
import { KittyOwner, KittyBalance, TransferTrace } from '../generated/schema'
import { BigInt, Address } from "@graphprotocol/graph-ts"

export function handleBirth(event: Birth): void {
    let id = event.params.kittyId.toHex() //use kitty id as the entity id
    let kitty = new KittyOwner(id)
    kitty.tokenId = event.params.kittyId
    kitty.owner = event.params.owner
    kitty.contract = event.address
    kitty.save()

    //bind the contract address in order to be able to access the public methods of the contract
    let contract = CryptoKitties.bind(event.address) 
    let kittyBalance = new KittyBalance(event.params.owner.toHex())
    kittyBalance.amount = contract.balanceOf(event.params.owner)
    kittyBalance.save()
}

export function handleTransfer(event: Transfer): void {
    let id = event.params.tokenId.toHex()
    let kitty = KittyOwner.load(id)
    if (kitty == null) {
        kitty = new KittyOwner(id)
        kitty.tokenId = event.params.tokenId
        kitty.contract = event.address
    }   
    kitty.owner = event.params.to
    kitty.save()

    //collect the entities of transfer traces
    let transferEntity = new TransferTrace(event.transaction.hash.toHex())
    transferEntity.from = event.params.from
    transferEntity.to = event.params.to
    transferEntity.timestamp = event.block.timestamp
    transferEntity.save()

    //update the amount of tokens hold by the owner "to"
    //first bind the contract address in order to be able to access the public 
    //methods of the contract
    let contract = CryptoKitties.bind(event.address) 
    let kittyBalance = new KittyBalance(event.params.to.toHex())
    kittyBalance.amount = contract.balanceOf(event.params.to)
    kittyBalance.save()
}