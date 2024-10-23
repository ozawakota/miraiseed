'use client';


import DrawingApp from './components/organisms/DrawingApp'

export default function CanvasPage() {

  return(
    <section className="p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 md:mb-10">キャンバス保存</h1>
        <div className="mb-16 gap-4 justify-between md:flex">
          <div className='mt-4'>
            <h2 className="text-xl font-bold pb-4">実装要件</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>オフライン保存</li>
              <li>IndexedDb使用</li>
              <li>undo（元に戻す） / redo（やりなおし）対応</li>
              <li>全て消すボタン</li>
              <li>プレビュー</li>
            </ul>
          </div>
          <div>
            <DrawingApp />
          </div>
        </div>
        <div className="mb-16">
          <h2 className="text-xl font-bold pb-4">メリット</h2>
          <p>様々な形式のデータ（数値、文字列、日付、バイナリデータ等）を保存することができます。</p>

        </div>

        <div className="mb-16">
          <h2 className="text-xl font-bold pb-4">ロジック</h2>
          <p>キー / バリュー</p>
          <div>
          </div>
          <ul className='mt-4 mb-6'>
            <li>canvasをindexdDBに保存し、ダウンロードドボタンを押すとFormData APIを使用して、PCに保存できる</li>
          </ul>
          <h2 className="text-xl font-bold pb-4">redoのロジック</h2>
          <ul>
            <li>1.まず、redoできるアクションがあるかチェックします。</li>
            <li>2.もしある場合、最後にundoしたアクションを取得します。</li>
            <li>3.そのアクションを描画履歴に追加し、redo履歴から削除します。</li>
            <li>4.最後に、キャンバスを再描画します。</li>
          </ul>
        </div>

      </div>
    </section>
  )
}