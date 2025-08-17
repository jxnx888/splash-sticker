import styles from "./page.module.css";
import Link from "next/link";
export default function Home() {

  return (
    <div className={styles.home}>
      <Link href={'/puzzle-flat'} >Puzzle Flat - 2D</Link>
      <Link href={'/splash-sticker'} >Splash Sticker - 3D</Link>
    </div>
  );
}
