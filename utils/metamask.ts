import { custom } from 'viem';
import { Address } from 'viem/accounts';
import { StoryClient, StoryConfig } from "@story-protocol/core-sdk";

declare global {
  interface Window {
    ethereum?: any;
  }
}

export const connectMetaMask = async (): Promise<Address> =>  {

  if(window.ethereum) {
      try {
        const accounts: [Address] = await window.ethereum.request({
          method: "eth_requestAccounts",
        });

        console.log(accounts)           
        return accounts[0];

      } catch (error) {
          console.log(error)
          throw error;
      }
  } else {
    console.error("MetaMask is not installed");
    throw new Error("MetaMask is not installed");
  }

}
