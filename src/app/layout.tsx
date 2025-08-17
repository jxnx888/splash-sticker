import type { Metadata } from "next";
import "../styles/globals.css";
import '@mantine/core/styles.css';
import { MantineProvider } from '@mantine/core';
import styles from "./page.module.css";


export const metadata: Metadata = {
  title: "Splash Sticker",
  description: "Splash Sticker into box",
};

export default function RootLayout({
                                     children,
                                   }: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
    <body className={styles.body}>
      <header className={styles.header}>Demo</header>
      <main className={styles.main}>
        <MantineProvider>
          {children}
        </MantineProvider>
      </main>
      <footer className={styles.footer}>
        footer
      </footer>
    </body>
    </html>
  );
}
