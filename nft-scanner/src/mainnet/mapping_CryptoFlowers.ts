import { log, BigInt } from '@graphprotocol/graph-ts';
import { TokenHolder } from "../../generated/schema";
import {
  Transfer, Birth, Money
} from '../../generated/CryptoFlowers/CryptoFlowers';

export function handleBirth(event: Birth): void {
  let id = event.address.toHex() + '#' + event.params.flowerId.toHex();
  let entity = new TokenHolder(id);
  entity.contract = event.address;
  entity.tokenId = event.params.flowerId;
  entity.owner = event.params.owner;
  entity.save();
}

export function handleMoney(event: Money): void {
  let id = event.address.toHex() + '#' + event.params.tokenId.toHex();
  let entity = new TokenHolder(id);
  entity.contract = event.address;
  entity.tokenId = event.params.tokenId;
  entity.owner = event.params.from;
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
