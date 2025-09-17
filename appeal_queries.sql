-- Appeal System Database Queries
-- Use these in Prisma Studio or directly in SQLite

-- 1. Check all appeals with user info
SELECT 
  a.id,
  a.ticketNumber,
  a.fineAmount,
  a.status,
  a.submissionDate,
  u.email,
  u.subscriptionType,
  u.appealTrialUsed
FROM Appeal a
JOIN User u ON a.userId = u.id
ORDER BY a.createdAt DESC;

-- 2. Check user subscription status and appeal counts
SELECT 
  u.email,
  u.subscriptionType,
  u.subscriptionStart,
  u.subscriptionEnd,
  u.appealTrialUsed,
  COUNT(a.id) as appeal_count
FROM User u
LEFT JOIN Appeal a ON u.id = a.userId
GROUP BY u.id
ORDER BY u.createdAt DESC;

-- 3. Check payment records linked to subscriptions
SELECT 
  p.id,
  p.amount,
  p.serviceType,
  p.status,
  p.createdAt,
  u.email,
  u.subscriptionType
FROM Payment p
JOIN User u ON p.userId = u.id
WHERE p.serviceType LIKE '%APPEAL%' OR p.serviceType = 'ANNUAL_PLAN'
ORDER BY p.createdAt DESC;

-- 4. Check users who might be trying to bypass limits
SELECT 
  u.email,
  u.subscriptionType,
  COUNT(a.id) as appeal_count,
  MAX(a.createdAt) as last_appeal_date
FROM User u
LEFT JOIN Appeal a ON u.id = a.userId
GROUP BY u.id
HAVING (u.subscriptionType = 'FREE_TRIAL' AND appeal_count > 1)
    OR (u.subscriptionType = 'SINGLE_APPEAL' AND appeal_count > 1)
ORDER BY appeal_count DESC;

-- 5. Appeals submitted in the last 24 hours
SELECT 
  a.id,
  a.ticketNumber,
  a.submissionDate,
  u.email,
  u.subscriptionType
FROM Appeal a
JOIN User u ON a.userId = u.id
WHERE a.submissionDate > datetime('now', '-1 day')
ORDER BY a.submissionDate DESC;
