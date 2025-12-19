lass UserService {
  async getUsersWithOrders(): Promise<UserWithOrders[]> {
    const users = await db.query('SELECT * FROM users');
    
    const result = [];
    for (const user of users) {
      // N+1問題: ユーザー数だけクエリ実行
      const orders = await db.query(
        'SELECT * FROM orders WHERE user_id = ?',
        [user.id]
      );
      
      // さらにN+M問題
      for (const order of orders) {
        const items = await db.query(
          'SELECT * FROM order_items WHERE order_id = ?',
          [order.id]
        );
        order.items = items;
      }
      
      result.push({
        ...user,
        orders: orders
      });
    }
    
    return result;
  }
}
