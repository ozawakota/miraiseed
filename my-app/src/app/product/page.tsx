'use client';

import { productSchema , ProductType } from './types/schema';


export default function ProductPage() {

  function somethingProduct(product: ProductType) {
    // Do something...
    console.log('=========');
    console.log('商品データ:', product);
    console.log('=========');
  }

  // Zodで値をパースする （検証させる）
  const parsed = productSchema.parse({
    sku: "ABC-1234",
    price: 50,
    expirationDate: "2026-01-01",
    // color: "red"
  });

  // パースしたものを関数に渡す
  somethingProduct(parsed);

  // somethingProduct({
  //   sku: "ABC-1234",
  //   price: -50,
  //   expirationDate: "2026-01-01",
  // })




  return(
    <section className="p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 md:mb-10">商品ページ</h1>

      </div>
    </section>
  )
}