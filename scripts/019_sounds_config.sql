-- Add sounds configuration row to site_config
INSERT INTO site_config (key, value) VALUES
  ('sounds', '{
    "enabled": true,
    "globalVolume": 0.5,
    "categories": {
      "success": { "enabled": true, "volume": 0.5, "soundId": "chime-1" },
      "notification": { "enabled": true, "volume": 0.6, "soundId": "notify-1" },
      "action": { "enabled": false, "volume": 0.3, "soundId": "click-1" },
      "alert": { "enabled": true, "volume": 0.7, "soundId": "alert-1" },
      "ai": { "enabled": true, "volume": 0.5, "soundId": "ai-1" }
    },
    "eventOverrides": {}
  }')
ON CONFLICT (key) DO NOTHING;
