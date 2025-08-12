import { Main } from "@/src/components/Main/Main";
import styles from "./page.module.css";

export default function Home() {

  return (
    <div className={styles.page}>
      <header className={styles.header}>Demo</header>
      <main className={styles.main}>
        <Main />
      </main>
      <footer className={styles.footer}>
        footer
      </footer>
    </div>
  );
}
