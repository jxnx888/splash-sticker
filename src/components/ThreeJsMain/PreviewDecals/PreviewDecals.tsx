import { useGlobalContext } from "@/src/libs/context/GlobalContext";
import React, { useId } from 'react';
import times from 'lodash/times'
import Image from 'next/image';
import styles from './PreviewDecals.module.css';

export const PreviewDecals = () => {
  const {setCurrentDecal, currentDecal} = useGlobalContext()
const uniqueId = useId();
  return times(54, (i) => {
    const decalPath = '/textures/decal/' + (i + 1) + '.png';
    return <div key={`${uniqueId}-${i+1}`} className={styles.decal} onClick={() => setCurrentDecal(decalPath)}>
      <Image
      src={decalPath}
      alt={`Decal ${i}`}
      width={100}
      height={100}
      key={i}
      className={currentDecal === decalPath ? styles.activeDecal : ''}
    /></div>
  });
};
