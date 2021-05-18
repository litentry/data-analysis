import { Transfer, Zedhorse } from '../generated/Zedhorse/Zedhorse'
import { NftOwner, NftBalance, TransferTrace } from '../generated/schema'
import { BigInt } from "@graphprotocol/graph-ts"

export function handleTransfer(event: Transfer): void {
    let id = event.params.tokenId.toHex()
    let nftOwner = NftOwner.load(id)
    if (nftOwner == null) {
        nftOwner = new NftOwner(id)
    }
    nftOwner.tokenId = event.params.tokenId
    nftOwner.owner = event.params.to
    nftOwner.contract = event.address
    nftOwner.save()
    
    //update the amount ot the token 
    let contract = Zedhorse.bind(event.address)
    let nftBalance = new NftBalance(event.params.to.toHex())
    nftBalance.amount = contract.balanceOf(event.params.to)
    nftBalance.totalSupply = contract.totalSupply()
    nftBalance.save()
    
    //collect the entities of transfer traces
    let transferEntity = new TransferTrace(event.transaction.hash.toHex())
    transferEntity.from = event.params.from
    transferEntity.to = event.params.to
    transferEntity.timestamp = event.block.timestamp
    transferEntity.save()
    
}
