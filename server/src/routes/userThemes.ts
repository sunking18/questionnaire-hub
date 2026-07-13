import { Router, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const userThemeRouter = Router();

// SQLite stores JSON as string, need to serialize/deserialize
const serializeTheme = (theme: any): any => {
  // PostgreSQL (JsonB) can store objects directly, SQLite needs string
  // Prisma handles this differently per provider, we just pass the object
  return theme;
};

// GET /api/user-themes - 获取当前用户的所有主题
userThemeRouter.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const themes = await prisma.userTheme.findMany({
      where: { userId: req.userId as string },
      orderBy: { updatedAt: 'desc' },
    });

    // Parse JSON string if stored as string (SQLite)
    const parsed = themes.map((t: any) => ({
      ...t,
      theme: typeof t.theme === 'string' ? JSON.parse(t.theme) : t.theme,
    }));

    res.json({
      success: true,
      data: parsed,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/user-themes/:id - 获取单个主题
userThemeRouter.get('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const theme = await prisma.userTheme.findFirst({
      where: { id: req.params.id as string, userId: req.userId as string },
    }) as any;

    if (!theme) {
      throw new AppError('主题不存在', 404);
    }

    res.json({
      success: true,
      data: {
        ...theme,
        theme: typeof theme.theme === 'string' ? JSON.parse(theme.theme) : theme.theme,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/user-themes - 创建新主题
userThemeRouter.post('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, theme } = req.body;

    if (!name || !theme) {
      throw new AppError('主题名称和配置不能为空', 400);
    }

    const userTheme = await prisma.userTheme.create({
      data: {
        userId: req.userId as string,
        name,
        theme: JSON.stringify(theme),
      },
    }) as any;

    res.status(201).json({
      success: true,
      data: {
        ...userTheme,
        theme: typeof userTheme.theme === 'string' ? JSON.parse(userTheme.theme) : userTheme.theme,
      },
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/user-themes/:id - 更新主题
userThemeRouter.put('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, theme } = req.body;

    const existing = await prisma.userTheme.findFirst({
      where: { id: req.params.id as string, userId: req.userId as string },
    });

    if (!existing) {
      throw new AppError('主题不存在', 404);
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (theme !== undefined) updateData.theme = JSON.stringify(theme);

    const updated = await prisma.userTheme.update({
      where: { id: req.params.id as string },
      data: updateData,
    }) as any;

    res.json({
      success: true,
      data: {
        ...updated,
        theme: typeof updated.theme === 'string' ? JSON.parse(updated.theme) : updated.theme,
      },
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/user-themes/:id - 删除主题
userThemeRouter.delete('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.userTheme.findFirst({
      where: { id: req.params.id as string, userId: req.userId as string },
    });

    if (!existing) {
      throw new AppError('主题不存在', 404);
    }

    await prisma.userTheme.delete({
      where: { id: req.params.id as string },
    });

    res.json({
      success: true,
      message: '主题已删除',
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/user-themes/:id/apply - 应用主题到问卷
userThemeRouter.post('/:id/apply', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { questionnaireId } = req.body;

    if (!questionnaireId) {
      throw new AppError('问卷ID不能为空', 400);
    }

    const userTheme = await prisma.userTheme.findFirst({
      where: { id: req.params.id as string, userId: req.userId as string },
    }) as any;

    if (!userTheme) {
      throw new AppError('主题不存在', 404);
    }

    const themeObj = typeof userTheme.theme === 'string' ? JSON.parse(userTheme.theme) : userTheme.theme;

    // 将主题配置写入问卷的 theme 字段
    const questionnaire = await prisma.questionnaire.update({
      where: { id: questionnaireId },
      data: { theme: JSON.stringify(themeObj) },
    }) as any;

    res.json({
      success: true,
      data: {
        ...questionnaire,
        theme: typeof questionnaire.theme === 'string' ? JSON.parse(questionnaire.theme) : questionnaire.theme,
      },
    });
  } catch (error) {
    next(error);
  }
});
