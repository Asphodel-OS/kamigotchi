import { EntityIndex } from '@mud-classic/recs'
import { Friends as FriendsType } from 'network/shapes/Account/friends'
import { Friendship } from 'network/shapes/Friendship'

/**
 * Friendship status between the local player and another account.
 */
export type FriendRequestStatus = {
  /** True if the viewed account is the player's own account. */
  isSelf: boolean
  /** True if the viewed account is not the player's own account. */
  isOther: boolean
  /** True if there is an incoming friend request from the account. */
  isIncoming: boolean
  /** True if there is an outgoing friend request to the account. */
  isOutgoing: boolean
  /** True if the account is a friend. */
  isFriend: boolean
  /** True if the account is blocked. */
  isBlocked: boolean
  /** The friendship object for an incoming request, if it exists. */
  incomingRequest?: Friendship
  /** The friendship object for an outgoing request, if it exists. */
  outgoingRequest?: Friendship
  /** The friendship object for an established friendship, if it exists. */
  friendFriendship?: Friendship
  /** The friendship object for a blocked user, if it exists. */
  blockedFriendship?: Friendship
}

/**
 * Find friendship status between the local player and a target account.
 * @param playerEntity The entity index of the local player.
 * @param accountEntity The entity index of the target account.
 * @param getFriends A utility function to retrieve the friends data for a given account entity.
 * @returns A `FriendRequestStatus` object detailing the relationship between the two accounts.
 */
export function getFriendshipStatus(
  playerEntity: EntityIndex,
  accountEntity: EntityIndex,
  getFriends: (accEntity: EntityIndex) => FriendsType
): FriendRequestStatus {
  const data = getFriends(playerEntity)

  const isSelf = playerEntity === accountEntity
  const isOther = !isSelf

  const incomingEntities = data?.incomingReqs?.map((req) => req.account.entity)
  const isIncoming = !!incomingEntities?.includes(accountEntity)
  const incomingRequest = data?.incomingReqs?.find((req) => req.account.entity === accountEntity)

  const outgoingEntities = data?.outgoingReqs?.map((req) => req.target.entity)
  const isOutgoing = !!outgoingEntities?.includes(accountEntity)
  const outgoingRequest = data?.outgoingReqs?.find((req) => req.target.entity === accountEntity)

  const friendEntities = data?.friends?.map((f) => f.target.entity)
  const isFriend = !!friendEntities?.includes(accountEntity)
  const friendFriendship = data?.friends?.find((f) => f.target.entity === accountEntity)

  const blockedEntities = data?.blocked?.map((b) => b.target.entity)
  const isBlocked = !!blockedEntities?.includes(accountEntity)
  const blockedFriendship = data?.blocked?.find((b) => b.target.entity === accountEntity)

  return {
    isSelf,
    isOther,
    isIncoming,
    isOutgoing,
    isFriend,
    isBlocked,
    incomingRequest,
    outgoingRequest,
    friendFriendship,
    blockedFriendship,
  }
}
