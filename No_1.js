// ❌ 佐藤さん(Type 3)が提出したコード
// 機能は動くが、品質面で問題がある実装例

import { Request, Response } from 'express';
import { db } from './database';

// クリスマスキャンペーン用の注文処理エンドポイント
export async function processChristmasOrder(req: Request, res: Response) {
  try {
    const { userId, items, couponCode } = req.body;
    
    // ユーザー情報取得
    const user = await db.query('SELECT * FROM users WHERE id = ' + userId);
    
    // 在庫チェックと価格計算
    let total = 0;
    let stockOk = true;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const product = await db.query('SELECT * FROM products WHERE id = ' + item.productId);
      
      if (product[0].stock < item.quantity) {
        stockOk = false;
        break;
      }
      
      // 価格計算(複雑な条件分岐)
      if (item.quantity > 10) {
        if (product[0].category == 'toy') {
          if (user[0].memberLevel == 'gold') {
            total += product[0].price * item.quantity * 0.7;
          } else if (user[0].memberLevel == 'silver') {
            total += product[0].price * item.quantity * 0.8;
          } else {
            total += product[0].price * item.quantity * 0.9;
          }
        } else if (product[0].category == 'book') {
          if (user[0].memberLevel == 'gold') {
            total += product[0].price * item.quantity * 0.75;
          } else {
            total += product[0].price * item.quantity * 0.85;
          }
        } else {
          total += product[0].price * item.quantity * 0.95;
        }
      } else if (item.quantity > 5) {
        // 中略... さらに複雑な分岐
        total += product[0].price * item.quantity * 0.95;
      } else {
        total += product[0].price * item.quantity;
      }
    }
    
    // クーポン適用
    if (couponCode) {
      const coupon = await db.query('SELECT * FROM coupons WHERE code = "' + couponCode + '"');
      if (coupon[0]) {
        if (coupon[0].type == 'percentage') {
          total = total * (1 - coupon[0].value / 100);
        } else {
          total = total - coupon[0].value;
        }
      }
    }
    
    // 在庫が足りない場合
    if (!stockOk) {
      res.status(400).json({ error: 'Stock insufficient' });
      return;
    }
    
    // 注文作成
    const orderId = await db.query(
      'INSERT INTO orders (user_id, total, status) VALUES (' + 
      userId + ', ' + total + ', "pending")'
    );
    
    // 在庫更新
    for (let i = 0; i < items.length; i++) {
      await db.query(
        'UPDATE products SET stock = stock - ' + items[i].quantity + 
        ' WHERE id = ' + items[i].productId
      );
    }
    
    res.json({ 
      success: true, 
      orderId: orderId,
      t: total 
    });
    
  } catch (e) {
    console.log(e);
    res.status(500).json({ error: 'Error' });
  }
}


// ✅ 田中さん(Type 1)が求める理想のコード例
/*
export async function processChristmasOrder(req: Request, res: Response) {
  try {
    const orderRequest = validateOrderRequest(req.body);
    const user = await UserRepository.findById(orderRequest.userId);
    
    const orderCalculation = await OrderService.calculateOrder({
      user,
      items: orderRequest.items,
      couponCode: orderRequest.couponCode
    });
    
    if (!orderCalculation.hasEnoughStock) {
      return res.status(400).json({ 
        error: ErrorCodes.INSUFFICIENT_STOCK,
        details: orderCalculation.insufficientItems 
      });
    }
    
    const order = await OrderService.createOrder(orderCalculation);
    
    return res.json({ 
      success: true, 
      orderId: order.id,
      total: order.total 
    });
    
  } catch (error) {
    logger.error('Order processing failed', { error, requestId: req.id });
    return handleOrderError(error, res);
  }
}
*/
