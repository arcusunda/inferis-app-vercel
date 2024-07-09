export interface Attribute {
  trait_type: string;
  value: string;
}

export interface StoryElement {
  id: number;
  name: string;
  description: string;
  image: string;
  wbpImage: string;
  aspect: string;
  isRoot: boolean;
  attributes?: Attribute[];
  state: string;
  ipId?: `0x${string}`;
  licenseTermsId?: string;
  derivativeRegistration?: string;
  isRegistered?: boolean;
  childrenData?: ChildData[];
  licenseTokenId?: string;
  dateCanonized?: Date;
  dateRegistered?: Date;
  isTokenized?: boolean;
  author: string;
  isSubmitted: boolean;
  created: Date;
  updated?: Date;
}

export interface HolderStoryElement {
  id: number;
  name: string;
  description: string;
  image: string;
  aspect: string;
  attributes?: Attribute[];
  state: string;
  dateCanonized?: Date;
  authorAddress: string;
  tokenId: String;
  isSubmitted: boolean;
  created: Date;
  updated?: Date;
}

export interface RootStoryElement {
  id: number;
  name: string;
  description: string;
  image: string;
  attributes?: Attribute[];
  created: Date;
  updated?: Date;
}

export interface ChildData {
  childName: string;
  ipId?: string;
  isRoyaltyTokensCollected?: boolean;
  royaltyTokensCollected?: number;
  snapshotId?: string;
  revenueTokensClaimed?: number;
}

export interface RootPrompt {
  id: number;
  name: string;
  promptText: string;
  created: Date;
}

export interface Prompt {
  id: number;
  aspect: string;
  promptText: string;
  storyElements: string;
  isParameterized: boolean;
  created: Date;
  updated?: Date;
}

export interface StoryAspect {
  id: number;
  name: string;
  description: string;
}

export interface Crafting { // Storybuilding Pass
  id: number;
  name: string;
  description: string;
  image: string;
  attributes?: Attribute[];
}

export interface Author {
  "id": number;
  "name": string;
  "role": string;
  "address": string;
}

export interface Character {
  name: string;
  givenName: string;
  description: string;
  image: string;
  wallet: string;
  tokenId: number;
  attributes: Attribute[];
}

export type Quest = {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
};

export type StoryIdea = {
  tokenId: string;
  text: string;
  image: string;
  state: 'Draft';
  isProse: boolean;
};

export type Chapter = {
  title: string;
  prose: string;
};

export type Prose = {
  tokenId: string;
  chapters: Chapter[];
  image: string;
  state: 'Draft';
};

export type Muerto = {
  _id: { $oid: string };
  name: string;
  image: string;
  attributes: Attribute[];
}

export type Talent = {
  _id: string;
  id: number;
  name: string;
  potency: number;
  description: string;
  categoryId: number;
  categoryName: string;
  categoryType: string;
}

export type TraitCategoryMap = {
  _id: string;
  trait: string;
  categoryId: number;
}

export type Category = {
  _id: string;
  id: number;
  name: string;
  description: string;
}

export type TraitCategories = { [key: string]: number | undefined };


export type NFT = {
  name: string;
  image: string;
  tokenId: string;
  attributes: {
    trait_type: string;
    value: string;
  }[];
}
