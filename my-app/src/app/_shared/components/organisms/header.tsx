'use client';

import Link from "next/link";

export default function Header() {


  return (
    <header className="mt-8">
      <h1 className="text-2xl font-bold text-center">
        <Link href="/">
          詳細設計試験場
        </Link>
      </h1>
      <nav className="mt-2">
        <ul className="flex gap-4 justify-items-center justify-center">
          <li>
              <Link
                href={{
                  pathname: '/keyboad',
                  query: { name: 'keyboad' },
                }}
              >
              キーボード制御
            </Link>
          </li>
          <li>
              <Link
                href={{
                  pathname: '/canvas',
                  query: { deliveryId: 'R40ST012938', userId: '14357' },
                }}
              >
              キャンバス保存
            </Link>
          </li>
          <li>
              <Link
                href={{
                  pathname: '/canvas-ichiran',
                }}
              >
              キャンバス一覧
            </Link>
          </li>

        </ul>
      </nav>
    </header>

  )
}