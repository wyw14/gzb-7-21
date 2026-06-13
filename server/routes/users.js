const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { readJSON, writeJSON } = require('../utils/storage');

const router = express.Router();

const TASK_DEFINITIONS = [
  { id: 'skillLevel', title: '完善乐器水平', description: '设置你的演奏水平等级', icon: '🎯' },
  { id: 'favoritePieces', title: '添加想练曲目', description: '添加你想练习的曲目', icon: '🎵' },
  { id: 'firstCheckin', title: '完成第一次打卡', description: '记录你的第一次练琴打卡', icon: '✅' },
  { id: 'favoriteOrInvite', title: '收藏乐器或发出邀约', description: '收藏一件乐器或发出一次练琴邀约', icon: '❤️' }
];

router.get('/', (req, res) => {
  const users = readJSON('users.json', []);
  const { skillLevel, instrument, city, keyword } = req.query;
  
  let result = users;
  
  if (skillLevel) {
    result = result.filter(u => u.skillLevel === skillLevel);
  }
  if (instrument) {
    result = result.filter(u => u.instruments.includes(instrument));
  }
  if (city) {
    result = result.filter(u => u.city.includes(city));
  }
  if (keyword) {
    const kw = keyword.toLowerCase();
    result = result.filter(u => 
      u.username.toLowerCase().includes(kw) ||
      u.bio.toLowerCase().includes(kw) ||
      u.instruments.some(i => i.toLowerCase().includes(kw))
    );
  }
  
  res.json(result);
});

router.get('/:id', (req, res) => {
  const users = readJSON('users.json', []);
  const user = users.find(u => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }
  res.json(user);
});

router.post('/login', (req, res) => {
  const { username, phone } = req.body;
  const users = readJSON('users.json', []);
  
  let user = users.find(u => u.phone === phone);
  
  if (!user) {
    user = {
      id: 'u' + uuidv4().slice(0, 8),
      username: username || '音乐爱好者' + Math.floor(Math.random() * 1000),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${uuidv4().slice(0, 6)}`,
      phone: phone || '138' + Math.floor(Math.random() * 100000000),
      city: '北京市',
      district: '海淀区',
      latitude: 39.9042,
      longitude: 116.4074,
      bio: '这个人很懒，什么都没留下...',
      skillLevel: '',
      instruments: [],
      favoritePieces: [],
      favoriteInstruments: [],
      freeTimes: [],
      rating: 5.0,
      reviewCount: 0,
      newbieGuideShown: false,
      createdAt: new Date().toISOString()
    };
    users.push(user);
    writeJSON('users.json', users);
  }
  
  res.json({ success: true, user });
});

router.put('/:id', (req, res) => {
  const users = readJSON('users.json', []);
  const idx = users.findIndex(u => u.id === req.params.id);
  
  if (idx === -1) {
    return res.status(404).json({ error: '用户不存在' });
  }
  
  users[idx] = { ...users[idx], ...req.body, id: users[idx].id };
  writeJSON('users.json', users);
  
  res.json({ success: true, user: users[idx] });
});

router.post('/:id/favorite/:instrumentId', (req, res) => {
  const users = readJSON('users.json', []);
  const idx = users.findIndex(u => u.id === req.params.id);
  
  if (idx === -1) {
    return res.status(404).json({ error: '用户不存在' });
  }
  
  const instrumentId = req.params.instrumentId;
  const favorites = users[idx].favoriteInstruments || [];
  const isFavorited = favorites.includes(instrumentId);
  
  if (isFavorited) {
    users[idx].favoriteInstruments = favorites.filter(id => id !== instrumentId);
  } else {
    users[idx].favoriteInstruments = [...favorites, instrumentId];
  }
  
  writeJSON('users.json', users);
  
  res.json({ 
    success: true, 
    isFavorited: !isFavorited,
    favoriteInstruments: users[idx].favoriteInstruments 
  });
});

router.get('/:id/tasks', (req, res) => {
  const users = readJSON('users.json', []);
  const checkins = readJSON('checkins.json', []);
  const invitations = readJSON('invitations.json', []);
  const user = users.find(u => u.id === req.params.id);
  
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }
  
  const userCheckins = checkins.filter(c => c.userId === user.id);
  const userInvitations = invitations.filter(i => i.inviterId === user.id);
  
  const tasks = TASK_DEFINITIONS.map(task => {
    let completed = false;
    let completedAt = null;
    
    switch (task.id) {
      case 'skillLevel':
        completed = !!(user.skillLevel && user.skillLevel !== '');
        break;
      case 'favoritePieces':
        completed = !!(user.favoritePieces && user.favoritePieces.length > 0);
        break;
      case 'firstCheckin':
        completed = userCheckins.length > 0;
        if (completed && userCheckins.length > 0) {
          const firstCheckin = [...userCheckins].sort((a, b) => 
            new Date(a.createdAt) - new Date(b.createdAt)
          )[0];
          completedAt = firstCheckin.createdAt;
        }
        break;
      case 'favoriteOrInvite':
        const hasFavorite = user.favoriteInstruments && user.favoriteInstruments.length > 0;
        const hasInvite = userInvitations.length > 0;
        completed = hasFavorite || hasInvite;
        if (completed) {
          const dates = [];
          if (hasFavorite) {
            dates.push(user.createdAt);
          }
          if (hasInvite) {
            const firstInvite = [...userInvitations].sort((a, b) => 
              new Date(a.createdAt) - new Date(b.createdAt)
            )[0];
            dates.push(firstInvite.createdAt);
          }
          completedAt = dates.sort((a, b) => new Date(a) - new Date(b))[0];
        }
        break;
    }
    
    return {
      ...task,
      completed,
      completedAt
    };
  });
  
  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;
  const progress = Math.round((completedCount / totalCount) * 100);
  const allCompleted = completedCount === totalCount;
  
  res.json({
    tasks,
    progress,
    completedCount,
    totalCount,
    allCompleted
  });
});

router.put('/:id/newbie-guide', (req, res) => {
  const users = readJSON('users.json', []);
  const idx = users.findIndex(u => u.id === req.params.id);
  
  if (idx === -1) {
    return res.status(404).json({ error: '用户不存在' });
  }
  
  users[idx].newbieGuideShown = req.body.shown !== false;
  writeJSON('users.json', users);
  
  res.json({ success: true, newbieGuideShown: users[idx].newbieGuideShown });
});

module.exports = router;
