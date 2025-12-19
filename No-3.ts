lass UserService {
  async getUsersWithOrders(): Promise<UserWithOrders[]> {
    // 修正: JOIN + GROUP BY で1クエリに最適化
    const result = await db.query(`
      SELECT 
        u.id, u.name, u.email,
        o.id as order_id, o.total, o.created_at as order_date,
        oi.id as item_id, oi.product_id, oi.quantity, oi.price
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      ORDER BY u.id, o.id, oi.id
    `);
    
    return this.transformQueryResult(result);
  }
  
  private transformQueryResult(rows: any[]): UserWithOrders[] {
    const map = new Map<number, UserWithOrders>();
    
    for (const row of rows) {
      if (!map.has(row.id)) {
        map.set(row.id, {
          id: row.id,
          name: row.name,
          email: row.email,
          orders: []
        });
      }
      
      const user = map.get(row.id)!;
      
      if (row.order_id) {
        let order = user.orders.find(o => o.id === row.order_id);
        if (!order) {
          order = {
            id: row.order_id,
            total: row.total,
            createdAt: row.order_date,
            items: []
          };
          user.orders.push(order);
        }
        
        if (row.item_id) {
          order.items.push({
            id: row.item_id,
            productId: row.product_id,
            quantity: row.quantity,
            price: row.price
          });
        }
      }
    }
    
    return Array.from(map.values());
  }
}
