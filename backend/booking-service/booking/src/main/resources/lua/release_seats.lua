local owner = ARGV[1]
local released = 0

for _, key in ipairs(KEYS) do
  if redis.call('GET', key) == owner then
    redis.call('DEL', key)
    released = released + 1
  end
end
return released
