"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { usePublicClient } from "wagmi";
import { keccak256, toBytes } from "viem";
import { IDENTITY_SBT_ADDRESS } from "@/config/constants";
import { IDENTITY_SBT_ABI } from "@/config/abi";
import { useState, useCallback } from "react";

export function useIdentity(address?: `0x${string}`) {
  const { data: isVerified, refetch: refetchVerified } = useReadContract({
    address: IDENTITY_SBT_ADDRESS as `0x${string}`,
    abi: IDENTITY_SBT_ABI,
    functionName: "isVerified",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: score, refetch: refetchScore } = useReadContract({
    address: IDENTITY_SBT_ADDRESS as `0x${string}`,
    abi: IDENTITY_SBT_ABI,
    functionName: "getScore",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: credentialKeys, refetch: refetchKeys } = useReadContract({
    address: IDENTITY_SBT_ADDRESS as `0x${string}`,
    abi: IDENTITY_SBT_ABI,
    functionName: "getCredentialKeys",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: identity, refetch: refetchIdentity } = useReadContract({
    address: IDENTITY_SBT_ADDRESS as `0x${string}`,
    abi: IDENTITY_SBT_ABI,
    functionName: "getIdentity",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!isVerified },
  });

  const refetch = () => {
    refetchVerified();
    refetchScore();
    refetchKeys();
    refetchIdentity();
  };

  return { isVerified: !!isVerified, score: Number(score || 0), credentialKeys: credentialKeys || [], identity, refetch };
}

export function useCreateIdentity() {
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const [isPending, setIsPending] = useState(false);
  const [hash, setHash] = useState<`0x${string}` | undefined>();

  const create = useCallback(async (data: string) => {
    setIsPending(true);
    try {
      const dataHash = keccak256(toBytes(data));
      const txHash = await writeContractAsync({
        address: IDENTITY_SBT_ADDRESS as `0x${string}`,
        abi: IDENTITY_SBT_ABI,
        functionName: "createIdentity",
        args: [dataHash],
      });
      setHash(txHash);
      await publicClient!.waitForTransactionReceipt({ hash: txHash });
      return txHash;
    } finally {
      setIsPending(false);
    }
  }, [writeContractAsync, publicClient]);

  return { create, isPending, hash };
}

export function useAddCredential() {
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const [isPending, setIsPending] = useState(false);
  const [hash, setHash] = useState<`0x${string}` | undefined>();

  const addCredential = useCallback(async (type: string, data: string) => {
    setIsPending(true);
    try {
      const credentialHash = keccak256(toBytes(data));
      const txHash = await writeContractAsync({
        address: IDENTITY_SBT_ADDRESS as `0x${string}`,
        abi: IDENTITY_SBT_ABI,
        functionName: "addCredential",
        args: [type, credentialHash],
      });
      setHash(txHash);
      await publicClient!.waitForTransactionReceipt({ hash: txHash });
      return txHash;
    } finally {
      setIsPending(false);
    }
  }, [writeContractAsync, publicClient]);

  return { addCredential, isPending, hash };
}

export function useAddCredentials() {
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const [isPending, setIsPending] = useState(false);
  const [hash, setHash] = useState<`0x${string}` | undefined>();

  const addCredentials = useCallback(async (items: { type: string; data: string }[]) => {
    setIsPending(true);
    try {
      const types = items.map((i) => i.type);
      const hashes = items.map((i) => keccak256(toBytes(i.data)));
      const txHash = await writeContractAsync({
        address: IDENTITY_SBT_ADDRESS as `0x${string}`,
        abi: IDENTITY_SBT_ABI,
        functionName: "addCredentials",
        args: [types, hashes],
      });
      setHash(txHash);
      await publicClient!.waitForTransactionReceipt({ hash: txHash });
      return txHash;
    } finally {
      setIsPending(false);
    }
  }, [writeContractAsync, publicClient]);

  return { addCredentials, isPending, hash };
}

export function useUpdateCredential() {
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const [isPending, setIsPending] = useState(false);
  const [hash, setHash] = useState<`0x${string}` | undefined>();

  const updateCredential = useCallback(async (type: string, data: string) => {
    setIsPending(true);
    try {
      const credentialHash = keccak256(toBytes(data));
      const txHash = await writeContractAsync({
        address: IDENTITY_SBT_ADDRESS as `0x${string}`,
        abi: IDENTITY_SBT_ABI,
        functionName: "updateCredential",
        args: [type, credentialHash],
      });
      setHash(txHash);
      await publicClient!.waitForTransactionReceipt({ hash: txHash });
      return txHash;
    } finally {
      setIsPending(false);
    }
  }, [writeContractAsync, publicClient]);

  return { updateCredential, isPending, hash };
}

export function useSetSocial() {
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const [isPending, setIsPending] = useState(false);
  const [hash, setHash] = useState<`0x${string}` | undefined>();

  const setSocial = useCallback(async (platform: string, handle: string) => {
    setIsPending(true);
    try {
      const platformHash = keccak256(toBytes(platform));
      const handleHash = keccak256(toBytes(handle));
      const txHash = await writeContractAsync({
        address: IDENTITY_SBT_ADDRESS as `0x${string}`,
        abi: IDENTITY_SBT_ABI,
        functionName: "setSocial",
        args: [platformHash, handleHash],
      });
      setHash(txHash);
      await publicClient!.waitForTransactionReceipt({ hash: txHash });
      return txHash;
    } finally {
      setIsPending(false);
    }
  }, [writeContractAsync, publicClient]);

  return { setSocial, isPending, hash };
}

export function useAddressByHandle(platform?: string, handle?: string) {
  const platformHash = platform ? keccak256(toBytes(platform)) : undefined;
  const handleHash = handle ? keccak256(toBytes(handle)) : undefined;

  const { data } = useReadContract({
    address: IDENTITY_SBT_ADDRESS as `0x${string}`,
    abi: IDENTITY_SBT_ABI,
    functionName: "getAddressByHandle",
    args: platformHash && handleHash ? [platformHash, handleHash] : undefined,
    query: { enabled: !!platformHash && !!handleHash },
  });

  return data as `0x${string}` | undefined;
}
