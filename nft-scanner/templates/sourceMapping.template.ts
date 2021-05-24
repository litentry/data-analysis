import { log, BigInt } from '@graphprotocol/graph-ts';
import { TokenHolder } from "../generated/schema";
import {
  Transfer,
  ERC721
} from '../generated/{{ contract_name }}/ERC721';

export function handleTransfer(event: Transfer): void {
  let id = event.address.toHex() + '#' + event.params.{{ eventParams_tokenId }}.toHex();

  log.info('Handle transfer: id: {}, address: {}, tokenId: {}', [id, event.address.toString(), event.params.{{ eventParams_tokenId }}.toString()]);

  let entity = TokenHolder.load(id);
  if (entity == null) {
    entity = new TokenHolder(id);
  }

  entity.contract = event.address;
  entity.tokenId = event.params.{{ eventParams_tokenId }};
  entity.owner = event.params.{{ eventParams_to }};

  entity.save();
  
  // let contract = ERC721.bind(event.address)
  // let tokenBalance = new TokenBalance(event.params.{{ eventParams_to }}.toHex());
  // tokenBalance.amount = contract.balanceOf(event.params.{{ eventParams_to }})
  // tokenBalance.totalSupply = contract.totalSupply()
  // tokenBalance.save()
}
