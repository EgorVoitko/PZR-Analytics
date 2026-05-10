const _settings = ref<Record<string, string>>({})
const _ready    = ref(false)

export function useSettings() {
  const client = useSupabaseClient()

  if (!_ready.value) {
    _ready.value = true
    client
      .from('settings')
      .select('key, value')
      .then(({ data }) => {
        if (data) {
          for (const row of data) _settings.value[row.key] = row.value
        }
      })
  }

  async function setSetting(key: string, value: string) {
    _settings.value[key] = value
    await client.from('settings').upsert({ key, value })
  }

  function getSetting(key: string, fallback = ''): string {
    return _settings.value[key] ?? fallback
  }

  return { settings: _settings, getSetting, setSetting }
}
