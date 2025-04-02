// components/ProfileTabsWrapper.tsx
'use client';

import ProfileTabs from './ProfileTabs';

export default function ProfileTabsWrapper({ userId }: { userId: string }) {
  return <ProfileTabs userId={userId} />;
}
