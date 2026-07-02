'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { configApi, type Announcement } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

// Seed announcements shown when system_announcements is not yet configured
const SEED_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'seed-1',
    title: 'Nâng cấp pipeline v2.5 đã sẵn sàng',
    content: 'Phase 2.5 DOM fallback đã được cải thiện với hai chế độ (Mode A: zero results, Mode B: partial results). LLM enrichment giờ hỗ trợ thêm model tier mới cho độ chính xác cao hơn.',
    date: '2026-05-14',
    pinned: true,
    active: true,
  },
  {
    id: 'seed-2',
    title: 'Thêm tính năng LLM Audit theo lô',
    content: 'Trang LLM Audit hỗ trợ xử lý hàng loạt chương trình, giúp kiểm tra chất lượng dữ liệu nhanh hơn.',
    date: '2026-05-12',
    pinned: false,
    active: true,
  },
  {
    id: 'seed-3',
    title: 'Hệ thống phân quyền RBAC nâng cấp',
    content: 'Quản lý vai trò và quyền hạn chi tiết hơn. Admin có thể phân công quyền theo từng tài nguyên.',
    date: '2026-05-08',
    pinned: false,
    active: true,
  },
];

function parseAnnouncements(raw: string | undefined): Announcement[] {
  if (!raw?.trim()) return SEED_ANNOUNCEMENTS;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : SEED_ANNOUNCEMENTS;
  } catch {
    return SEED_ANNOUNCEMENTS;
  }
}

interface ConfigContextValue {
  llmEnabled: boolean;
  configLoading: boolean;
  announcements: Announcement[];
  refetchConfig: () => Promise<void>;
}

const ConfigContext = createContext<ConfigContextValue>({
  llmEnabled: true,
  configLoading: true,
  announcements: SEED_ANNOUNCEMENTS,
  refetchConfig: async () => {},
});

export function ConfigProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [llmEnabled, setLlmEnabled] = useState(true);
  const [configLoading, setConfigLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<Announcement[]>(SEED_ANNOUNCEMENTS);

  const fetchConfig = useCallback(async () => {
    if (!user) {
      setConfigLoading(false);
      return;
    }
    setConfigLoading(true);
    try {
      const cfg = await configApi.getAll();
      setLlmEnabled((cfg.enable_llm_extract ?? 'true') === 'true');
      setAnnouncements(parseAnnouncements(cfg.system_announcements));
    } catch {
      setLlmEnabled(true);
    } finally {
      setConfigLoading(false);
    }
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  return (
    <ConfigContext.Provider value={{ llmEnabled, configLoading, announcements, refetchConfig: fetchConfig }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  return useContext(ConfigContext);
}
