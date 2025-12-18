export class UserController {
  constructor(private userService: UserService) {}

  async getUser(req: Request, res: Response) {
    const userId = req.params.id;
    const user = await this.userService.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    return res.json(user);
  }

  async updateUser(req: Request, res: Response) {
    const userId = req.params.id;
    const updateData = req.body;
    
    const user = await this.userService.update(userId, updateData);
    return res.json(user);
  }
}
