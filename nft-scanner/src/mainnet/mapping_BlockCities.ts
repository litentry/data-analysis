import { log, BigInt } from '@graphprotocol/graph-ts';
import { TokenHolder } from "../../generated/schema";
import {
  Transfer, BuildingMinted
} from '../../generated/BlockCities/BlockCities';

export function handleBuildingMinted(event: BuildingMinted): void {
  let id = event.address.toHex() + '#' + event.params._tokenId.toHex();
  let entity = new TokenHolder(id);
  entity.contract = event.address;
  entity.tokenId = event.params._tokenId;
  entity.owner = event.params._to;
  entity.save();
}

export function handleTransfer(event: Transfer): void {
  let id = event.address.toHex() + '#' + event.params.tokenId.toHex();

  log.info('[BlockCities] Handle transfer: id: {}, address: {}, tokenId: {}', [id, event.address.toString(), event.params.tokenId.toString()]);

  let entity = TokenHolder.load(id);
  if (entity == null) {
    entity = new TokenHolder(id);
  }

  entity.contract = event.address;
  entity.tokenId = event.params.tokenId;
  entity.owner = event.params.to;

  entity.save();
}
