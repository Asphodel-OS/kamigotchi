import { ethers } from 'ethers';

import { Contracts } from 'engine/types';

export type ContractTopics = {
  key: string;
  topics: string[][];
};

type TopicsConfig<C extends Contracts> = {
  [ContractType in keyof C]: {
    abi: ethers.Interface;
    topics: (keyof C[ContractType]['filters'])[];
  };
};

// we make some assumptions here on the input topic config being valid
export function createTopics<C extends Contracts>(config: TopicsConfig<C>): ContractTopics[] {
  const contractTopics: ContractTopics[] = [];
  for (const key of Object.keys(config)) {
    const { abi, topics } = config[key]!;
    const contractTopic = [topics.map((t) => abi.getEvent(t as string)!.topicHash || [])] as Array<
      string[]
    >;
    contractTopics.push({
      key,
      topics: contractTopic,
    });
  }
  return contractTopics;
}
