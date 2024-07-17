'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { StoryIdea } from '../../../app/types';
import { useAccount } from "wagmi";
import { NFTBaseContractAddress, NFTStakingContractAddress } from '../../../utils/utils';
import axios from 'axios';
import '@/app/globals.css';
import ClipLoader from "react-spinners/ClipLoader";
import {
	RegExpMatcher,
	TextCensor,
	englishDataset,
	englishRecommendedTransformers,
} from 'obscenity';

const StoryIdeasList = () => {
  const [storyIdeas, setStoryIdeas] = useState<StoryIdea[]>([]);
  const { address } = useAccount();
  const [comments, setComments] = useState<{ [key: string]: string }>({});
  const [yesVotes, setYesVotes] = useState<{ [key: string]: number }>({});
  const [noVotes, setNoVotes] = useState<{ [key: string]: number }>({});
  const [voteStatus, setVoteStatus] = useState<{ [key: string]: boolean }>({});
  const [isHolder, setIsHolder] = useState(false);
  const [loading, setLoading] = useState(true);
  const censor = new TextCensor();
  const matcher = new RegExpMatcher({
    ...englishDataset.build(),
    ...englishRecommendedTransformers,
  });

  useEffect(() => {
    const fetchData = async () => {
      const response = await axios.get('/api/alchemy', {
        params: {
          wallet: address,
          contractAddress: NFTBaseContractAddress,
        },
      });

      const isHolderOfNFTContract = response.data.isHolderOfContract;

      const responseWb = await axios.get('/api/alchemy', {
        params: {
          wallet: address,
          contractAddress: NFTStakingContractAddress,
        },
      });

      const isHolderOfStakingContract = responseWb.data.isHolderOfContract;

      console.info('isHolderOfNFTContract:', isHolderOfNFTContract);
      console.info('isHolderOfStakingContract:', isHolderOfStakingContract);
      if (isHolderOfNFTContract || isHolderOfStakingContract) {
        setIsHolder(true);
      } else {
        setIsHolder(false);
      }
    };
    fetchData();

  }, [address]);

  useEffect(() => {

    const fetchData = async () => {
      setLoading(true);
      const response = await fetch(`/api/storyideas/`);
      const data = await response.json();
      setStoryIdeas(data);
      setLoading(false);
    };

    fetchData();
  }, [address]);

  useEffect(() => {
    if (storyIdeas.length === 0) return;

    const updateVoteStatusAndLikes = async () => {
      const statusData = await Promise.all(
        storyIdeas.map(async (storyIdea) => {
          const voteData = await fetchVoteStatus(storyIdea.tokenId);
          return {
            tokenId: storyIdea.tokenId,
            yesVotes: voteData.yesVotes,
            noVotes: voteData.noVotes,
            userVote: voteData.userVote,
          };
        })
      );

      const yesVotesData: { [key: string]: number } = {};
      const noVotesData: { [key: string]: number } = {};
      const voteStatusData: { [key: string]: boolean } = {};

      statusData.forEach(({ tokenId, yesVotes, noVotes, userVote }) => {
        yesVotesData[tokenId] = yesVotes;
        noVotesData[tokenId] = noVotes;
        voteStatusData[tokenId] = !!userVote;
      });

      setYesVotes(yesVotesData);
      setNoVotes(noVotesData);
      setVoteStatus(voteStatusData);
    };

    updateVoteStatusAndLikes();
  }, [storyIdeas]);

  const fetchVoteStatus = async (tokenId: number) => {
    const response = await fetch(`/api/storyideas/vote/check-vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tokenId, voterAddress: address }),
    });

    const data = await response.json();
    return data;
  };

  function convertIpfsUrl(ipfsUrl: string): string {
    if (ipfsUrl.startsWith('ipfs://')) {
      return ipfsUrl.replace('ipfs://', 'https://ipfs.io/ipfs/');
    }
    return ipfsUrl;
  }

  const handleVoteClick = async (tokenId: number, vote: string) => {
    const voterAddress = address;
      const comment = comments[tokenId] || '';
      const matches = matcher.getAllMatches(comment);
      const censoredComment = censor.applyTo(comment, matches);
      const response = await fetch('/api/storyideas/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        voterAddress,
        tokenId,
        vote,
        comment: censoredComment
      }),
    });

    if (response.ok) {
      const data = await response.json();
      setYesVotes((prevVotes) => ({
        ...prevVotes,
        [tokenId]: data.yesVotes,
      }));
      setNoVotes((prevVotes) => ({
        ...prevVotes,
        [tokenId]: data.noVotes,
      }));
      setVoteStatus((prevStatus) => ({
        ...prevStatus,
        [tokenId]: true,
      }));
    }
  };

  const handleCommentChange = (tokenId: number, value: string) => {
    setComments((prevComments) => ({
      ...prevComments,
      [tokenId]: value,
    }));
  };

  const renderNavigation = () => (
    <nav className="bg-gray-800 p-4">
      <ul className="flex justify-center items-center space-x-4">
        <li className="relative pr-4 after:content-[''] after:block after:absolute after:top-0 after:right-0 after:h-full after:w-px after:bg-gray-400">
          <Link href="/muertos/assets/" className="text-white hover:text-gray-300">
            Your Muertos
          </Link>
        </li>
        <li className="relative pr-4 after:content-[''] after:block after:absolute after:top-0 after:right-0 after:h-full after:w-px after:bg-gray-400">
          <Link href="/muertos/storyideas/" className="text-white hover:text-gray-300">
            Story Ideas
          </Link>
        </li>
        <li>
          <w3m-button />
        </li>
      </ul>
    </nav>
  );

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-900 text-white">
        <ClipLoader color="#ffffff" loading={loading} size={50} />
        <p className="mt-4">Loading all story ideas...</p>
        <div className="grid grid-cols-3 md:grid-cols-2 lg:grid-cols-1 gap-4 mt-4">
          {[1, 2, 3].map((_, index) => (
            <div key={index} className="border rounded p-6 bg-gray-800 animate-pulse">
              <div className="h-3 bg-gray-700 mb-2 rounded"></div>
            </div>
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-6">
    <h1>Story Ideas</h1>
      <div className="w-full">
        {storyIdeas.map((storyIdea) => (
          <div key={storyIdea.tokenId} className="border rounded p-4 mb-6">
            <h3>Token ID: {storyIdea.tokenId}</h3>
            {storyIdea.image && (
              <div className="mb-4">
                <img
                  src={convertIpfsUrl(storyIdea.image)}
                  alt={`${storyIdea.tokenId} Image`}
                  className="w-1/4 h-auto rounded"
                />
              </div>
            )}
            <div className="prose prose-lg">
              <p>{storyIdea.text}</p>
            </div>
            {isHolder && (
              <>
                <div className="overflow-x-auto w-full">
                  <table className="table-auto w-full border-collapse border border-gray-400">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 border border-gray-400 text-center">Vote</th>
                        <th className="px-4 py-2 border border-gray-400 text-center">Comment</th>
                        <th className="px-4 py-2 border border-gray-400 text-center">Published</th>
                        <th className="px-4 py-2 border border-gray-400 text-center">Yes Votes</th>
                        <th className="px-4 py-2 border border-gray-400 text-center">No Votes</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="px-4 py-2 border border-gray-400 text-center">
                          <div className="flex justify-center space-x-4">
                            <button
                              onClick={() => handleVoteClick(storyIdea.tokenId, 'Yes')}
                              className={`px-2 py-1 rounded ${
                                voteStatus[storyIdea.tokenId]
                                  ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                                  : 'bg-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed'
                              }`}
                              disabled={true}
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => handleVoteClick(storyIdea.tokenId, 'No')}
                              className={`px-2 py-1 rounded ${
                                voteStatus[storyIdea.tokenId]
                                  ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                                  : 'bg-red-500 text-white disabled:opacity-50 disabled:cursor-not-allowed'
                              }`}
                              disabled={true}
                            >
                              No
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-2 border border-gray-400 text-center">
                          <input
                            type="text"
                            placeholder="Comment"
                            value={comments[storyIdea.tokenId] || ''}
                            onChange={(e) => handleCommentChange(storyIdea.tokenId, e.target.value)}
                            className={`w-full p-2 bg-gray-700 text-white rounded focus:ring-2 focus:ring-blue-500 focus:outline-none ${voteStatus[storyIdea.tokenId] ? 'disabled' : ''}`}
                            disabled={voteStatus[storyIdea.tokenId]}
                          />
                        </td>
                        <td className="px-4 py-2 border border-gray-400 text-center">
                          {storyIdea.isProse ? (
                            <div>
                              <img src="/published.png" alt="Published" className="inline-block ml-2 h-8 w-8" />
                            </div>
                          ) : (
                            'No'
                          )}
                        </td>
                        <td className="px-4 py-2 border border-gray-400 text-center">{yesVotes[storyIdea.tokenId] || 0}</td>
                        <td className="px-4 py-2 border border-gray-400 text-center">{noVotes[storyIdea.tokenId] || 0}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </main>
  );
  
};

export default StoryIdeasList;
