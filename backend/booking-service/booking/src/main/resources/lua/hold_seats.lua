local owner = ARGV[1]
local ttl = ARGV[2]

for _, key in ipairs(KEYS) do
  local current = redis.call('GET', key)
  if current and current ~= owner then
    return 0
  end
end

for _, key in ipairs(KEYS) do
  redis.call('SET', key, owner, 'EX', ttl)
end
return 1
