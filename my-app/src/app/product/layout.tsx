import type { ReactNode } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '商品ページ一覧',
};

export default function Layout({ children }: { children: ReactNode }) {
  return <div className='c-sec'>{children}</div>;
}