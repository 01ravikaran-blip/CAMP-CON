'use client';

import { useComputeNode } from '../hooks/useComputeNode';

export default function ComputeNodeProvider() {
  useComputeNode();
  return null;
}
