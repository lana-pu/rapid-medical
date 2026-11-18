-- One copy of every file (2026-11-18): the media library had the same picture or video once per Duda site (US, OUS, APAC)
-- and sometimes as a resized or recompressed copy. Every duplicate's address becomes its original's in every text and
-- JSON column, a duplicate's description goes to the original if it has none, and the duplicate's row goes. The files are
-- removed from public/uploads in the same commit; content/seed/media-aliases.json keeps the seed from bringing them back.
-- Checked by eye where not byte-identical: docs/memory/findings/media-dedupe-2026-11-18.md.
DO $$
DECLARE m record; c record;
BEGIN
  CREATE TEMP TABLE dedupe_map(f text PRIMARY KEY, t text) ON COMMIT DROP;
  INSERT INTO dedupe_map VALUES
    ('/uploads/duda/3670-Rapid-Medical-COMANECI-Expand---Compress-Dynamic-V1_HIGHRES_Transparent-aac0f1.gif', '/uploads/duda/3670-Rapid-Medical-COMANECI-Expand---Compress-Dynamic-V1_HIGHRES_Transparent-a1944b.gif'),
    ('/uploads/duda/3670-Rapid-Medical-COMANECI-Expand---Compress-Dynamic-V1_HIGHRES_Transparent-b8d370.gif', '/uploads/duda/3670-Rapid-Medical-COMANECI-Expand---Compress-Dynamic-V1_HIGHRES_Transparent-a1944b.gif'),
    ('/uploads/duda/Product-Overview-Comaneci_D3-82c016.jpg', '/uploads/duda/OUS-Aneurysm-Specifications-c4065c.jpg'),
    ('/uploads/duda/2_COMANECI-Aneurism-Stability-4c5948.gif', '/uploads/duda/2_COMANECI-Aneurism-Stability-a69863.gif'),
    ('/uploads/duda/2_COMANECI-Aneurism-Stability-85b76e.gif', '/uploads/duda/2_COMANECI-Aneurism-Stability-a69863.gif'),
    ('/uploads/duda/chart-image-9eaf64.png', '/uploads/duda/chart-image-c14309.png'),
    ('/uploads/duda/chart-image-e8284e.png', '/uploads/duda/chart-image-c14309.png'),
    ('/uploads/duda/Aneurysym-slider-2-87b2e1.png', '/uploads/duda/COMANECI-testimonial-2-942a3a.png'),
    ('/uploads/duda/RM_Drivewire-Ad_Graphic-V2-f76cbc.png', '/uploads/duda/RM_Drivewire-Ad_Graphic-V2-30999b.png'),
    ('/uploads/duda/RM_Drivewire-Ad_Graphic-V2-3dfb10.png', '/uploads/duda/RM_Drivewire-Ad_Graphic-V2-30999b.png'),
    ('/uploads/duda/Drivewire_middle-diagram-7fe2fc.png', '/uploads/duda/Drivewire_middle-diagram-5944d55f-3c6376.png'),
    ('/uploads/duda/Specifications-69aa94.jpg', '/uploads/duda/Specifications-e17c8c.jpg'),
    ('/uploads/duda/Screenshot-2025-05-08-at-12.39.08-PM-ad3b54.png', '/uploads/duda/Screenshot-2025-05-08-at-12.39.08-PM-c63c3c.png'),
    ('/uploads/duda/Screenshot-2025-05-08-at-12.39.08-PM-7e0667.png', '/uploads/duda/Screenshot-2025-05-08-at-12.39.08-PM-c63c3c.png'),
    ('/uploads/duda/Solutions-OUS-1-ef6da4.png', '/uploads/duda/Solutions-OUS-1-f0d8c4.png'),
    ('/uploads/duda/Solutions-OUS-2-c0358e.png', '/uploads/duda/Solutions-OUS-2-42f638.png'),
    ('/uploads/duda/Solutions-OUS-3-b747b8.png', '/uploads/duda/Solutions-OUS-3-311117.png'),
    ('/uploads/duda/OUS-MVO-Product-Overview-c328f30b-2cbd89.jpg', '/uploads/duda/OUS-MVO-Product-Overview-4fc57d.jpg'),
    ('/uploads/duda/Specifications-Resized-868257.jpg', '/uploads/duda/Specifications-Resized-98a228.jpg'),
    ('/uploads/duda/Specifications-Resized-d26b18.jpg', '/uploads/duda/Specifications-Resized-98a228.jpg'),
    ('/uploads/duda/First-pass-c68dfc.png', '/uploads/duda/First-pass-6f552f.png'),
    ('/uploads/duda/First-pass-3-d537c3.png', '/uploads/duda/First-pass-3-ab6b62.png'),
    ('/uploads/duda/Com-VS-radial-force-comp-b1a7df.png', '/uploads/duda/Com-VS-radial-force-comp-1f5739.png'),
    ('/uploads/duda/vasospasm-stats-c34f0c.jpg', '/uploads/duda/vasospasm-stats-1920w-9a8b70.png'),
    ('/uploads/duda/vasospasm-stats-f557f5.jpg', '/uploads/duda/vasospasm-stats-1920w-9a8b70.png'),
    ('/uploads/duda/OUS_Drivewire-chart_Product-Overview-47e23a.jpg', '/uploads/duda/OUS_Drivewire-chart_Product-Overview-6ac24f.jpg'),
    ('/uploads/duda/US-LVO-Product-Overview-cede34.webp', '/uploads/duda/US-LVO-Product-Overview-1ac5ad.jpg'),
    ('/uploads/duda/WhatsApp-Image-2026-07-21-at-10.30.00--281-29-8107162e-82aba9.png', '/uploads/duda/WhatsApp-Image-2026-07-21-at-10.30.00--281-29-8107162e-311505.png'),
    ('/uploads/duda/WhatsApp-Image-2026-07-21-at-10.30.00--281-29-29656de8-9035a4.png', '/uploads/duda/WhatsApp-Image-2026-07-21-at-10.30.00--281-29-8107162e-311505.png'),
    ('/uploads/duda/Untitled-1-e3fb2907-ea01fa.png', '/uploads/duda/Untitled-1-e3fb2907-3a5ce0.png'),
    ('/uploads/duda/Screenshot-2025-11-23-at-02.04.57-365dad50-85666a.png', '/uploads/duda/Screenshot-2025-11-23-at-02.04.57-365dad50-6e9556.png'),
    ('/uploads/duda/11-22jcm-1899801-1--f103c3.pdf', '/uploads/duda/jcm-1899801-cb8809.pdf'),
    ('/uploads/duda/1-obile-5e5427.png', '/uploads/duda/1-desk-a15d1f.png'),
    ('/uploads/duda/3666-TT13-Expand---Compress-Dynamic-V3_HIGHRES-e31360.gif', '/uploads/duda/3666-TT13-Expand---Compress-Dynamic-V3_HIGHRES-Stitched-Clip--f01242.gif'),
    ('/uploads/duda/Screenshot-2025-07-21-at-8.49.02-AM-82d93b.png', '/uploads/duda/Screenshot-2025-07-21-at-8.49.02-AM-602312.png'),
    ('/uploads/duda/Screenshot-2025-07-21-at-8.49.02-AM-ea309f.png', '/uploads/duda/Screenshot-2025-07-21-at-8.49.02-AM-602312.png'),
    ('/uploads/duda/Screenshot-2025-07-21-at-8.49.02-AM-255525.png', '/uploads/duda/Screenshot-2025-07-21-at-8.49.02-AM-602312.png'),
    ('/uploads/duda/Screenshot-2025-07-21-at-8.49.02-AM-afbaf7.png', '/uploads/duda/Screenshot-2025-07-21-at-8.49.02-AM-602312.png'),
    ('/uploads/duda/Screenshot-2025-07-21-at-8.49.02-AM-cdaf1f.png', '/uploads/duda/Screenshot-2025-07-21-at-8.49.02-AM-602312.png'),
    ('/uploads/duda/Rapid-Medical-Logo-28982953-90bd2e.png', '/uploads/duda/Rapid-Medical-Logo-28982953-51ad35.png'),
    ('/uploads/duda/Rapid-Medical-Logo-28982953-2e2044.png', '/uploads/duda/Rapid-Medical-Logo-28982953-51ad35.png'),
    ('/uploads/duda/Screenshot-2025-07-21-at-9.29.37-AM-647a53.png', '/uploads/duda/Screenshot-2025-07-21-at-9.29.37-AM-cbea62.png'),
    ('/uploads/duda/Screenshot-2025-07-21-at-9.29.37-AM-962785f2-81f72d.png', '/uploads/duda/Screenshot-2025-07-21-at-9.29.37-AM-cbea62.png'),
    ('/uploads/duda/Screenshot-2025-07-21-at-9.29.37-AM-4c7967.png', '/uploads/duda/Screenshot-2025-07-21-at-9.29.37-AM-cbea62.png'),
    ('/uploads/duda/Screenshot-2025-07-21-at-9.29.37-AM-352845.png', '/uploads/duda/Screenshot-2025-07-21-at-9.29.37-AM-cbea62.png'),
    ('/uploads/duda/Screenshot-2025-07-21-at-9.29.37-AM-962785f2-ffcfd5.png', '/uploads/duda/Screenshot-2025-07-21-at-9.29.37-AM-cbea62.png'),
    ('/uploads/duda/i7x3QkN4SCmElyjtyiDA_RAPID-MEDICAL_01_TIGERTRIEVER-LOGO_720_LOOP-v-9faafb.mp4', '/uploads/duda/i7x3QkN4SCmElyjtyiDA_RAPID-MEDICAL_01_TIGERTRIEVER-LOGO_720_LOOP-v-c7c95b.mp4'),
    ('/uploads/duda/i7x3QkN4SCmElyjtyiDA_RAPID-MEDICAL_01_TIGERTRIEVER-LOGO_720_LOOP-v-10b47a.mp4', '/uploads/duda/i7x3QkN4SCmElyjtyiDA_RAPID-MEDICAL_01_TIGERTRIEVER-LOGO_720_LOOP-v-c7c95b.mp4'),
    ('/uploads/duda/Ysj0VQoCRIS60VWmLvzj_Tiger-Stair-graph_animated-v-70bd14.mp4', '/uploads/duda/Ysj0VQoCRIS60VWmLvzj_Tiger-Stair-graph_animated-v-c6e6b0.mp4'),
    ('/uploads/duda/Ysj0VQoCRIS60VWmLvzj_Tiger-Stair-graph_animated-v-baed6a.mp4', '/uploads/duda/Ysj0VQoCRIS60VWmLvzj_Tiger-Stair-graph_animated-v-c6e6b0.mp4'),
    ('/uploads/duda/j4Uo8taSRCv4Ch0EW7r1_TIGER-graph_website-v-2c233d.mp4', '/uploads/duda/j4Uo8taSRCv4Ch0EW7r1_TIGER-graph_website-v-bd43fb.mp4'),
    ('/uploads/duda/067J7P1fRCGyilO6KPCe_HowTo_1-v-0ed12e.mp4', '/uploads/duda/067J7P1fRCGyilO6KPCe_HowTo_1-v-909e13.mp4'),
    ('/uploads/duda/067J7P1fRCGyilO6KPCe_HowTo_1-v-cd72e4.mp4', '/uploads/duda/067J7P1fRCGyilO6KPCe_HowTo_1-v-909e13.mp4'),
    ('/uploads/duda/0saPDx9aSyyoIoj5zk9d_HowTo_2-v-f8013f.mp4', '/uploads/duda/0saPDx9aSyyoIoj5zk9d_HowTo_2-v-4a8276.mp4'),
    ('/uploads/duda/0saPDx9aSyyoIoj5zk9d_HowTo_2-v-36f3b9.mp4', '/uploads/duda/0saPDx9aSyyoIoj5zk9d_HowTo_2-v-4a8276.mp4'),
    ('/uploads/duda/sjIQ67SJQYupyII8PBjC_HowTo_3-v-7ba444.mp4', '/uploads/duda/sjIQ67SJQYupyII8PBjC_HowTo_3-v-275fb6.mp4'),
    ('/uploads/duda/sjIQ67SJQYupyII8PBjC_HowTo_3-v-6c2627.mp4', '/uploads/duda/sjIQ67SJQYupyII8PBjC_HowTo_3-v-275fb6.mp4'),
    ('/uploads/duda/YZIbnEVShmzXOfSkqfeP_Comaneci-Blood-Flow-v-0effe3.mp4', '/uploads/duda/xTssjdbXR6QAyB451i8m_Comaneci-Blood-Flow-v-df9483.mp4'),
    ('/uploads/duda/nVGpaaf1Qhn4FzSmHI6e_Comaneci-Blood-Flow-v-375561.mp4', '/uploads/duda/xTssjdbXR6QAyB451i8m_Comaneci-Blood-Flow-v-df9483.mp4'),
    ('/uploads/duda/kyPILWv5TcOjXPybGxxQ_T13-Tiger-wireframe-walk-16x9-v-ae971d.mp4', '/uploads/duda/kyPILWv5TcOjXPybGxxQ_T13-Tiger-wireframe-walk-16x9-v-526238.mp4'),
    ('/uploads/duda/y7kLSI57QYivo26E99wA_Web---Vessel-displacement-video---edit-v-ec32b8.mp4', '/uploads/duda/y7kLSI57QYivo26E99wA_Web---Vessel-displacement-video---edit-v-01806c.mp4'),
    ('/uploads/duda/IVrIJ8XYRkCmpOUJNFsI_Hero_vessel-animation-v-dc777b.mp4', '/uploads/duda/IVrIJ8XYRkCmpOUJNFsI_Hero_vessel-animation-v-ac1293.mp4'),
    ('/uploads/duda/rRCzwiTS2JXz3BOhSARg_Com-VS-stair-graph-v2-v-acb3fc.mp4', '/uploads/duda/rRCzwiTS2JXz3BOhSARg_Com-VS-stair-graph-v2-v-64f8d3.mp4'),
    ('/uploads/duda/PUkQzKDTSRmfvkcm26oF_RAPID-MEDICAL_07_Comaneci-Blood-Flow-v-1d2ba0.mp4', '/uploads/duda/GqX322JIQRe3C0ZglhEd_Comaneci-Blood-Flow_VASO-OUS-APAC--v-2a8bc3.mp4'),
    ('/uploads/duda/GmiuX37hStWkhs64aaUW_Comaneci-Blood-Flow_VASO-OUS-APAC--v-3752b4.mp4', '/uploads/duda/GqX322JIQRe3C0ZglhEd_Comaneci-Blood-Flow_VASO-OUS-APAC--v-2a8bc3.mp4'),
    ('/uploads/duda/QQuW3ImTXeHzbz1ns8jz_COMANECI_Aneurysm_--x22-See-the-Comparison--x22-asset_RAPID-MEDICAL-06_COMANECI-GRAPHS_01-v-b22271.mp4', '/uploads/duda/1HV3uqyuQgOBFBJxUEN4_COMANECI_Aneurysm_--x22_See-the-Comparison--x22_-asset_RAPID-MEDICAL-06_COMANECI-GRAPHS_01-resized-v-bd5855.mp4'),
    ('/uploads/duda/kusAu4gQTBWBReOlod2g_COMANECI_Aneurysm_--x22_See-the-Comparison--x22_-asset_RAPID-MEDICAL-06_COMANECI-GRAPHS_01-resized-v-2fbfc1.mp4', '/uploads/duda/1HV3uqyuQgOBFBJxUEN4_COMANECI_Aneurysm_--x22_See-the-Comparison--x22_-asset_RAPID-MEDICAL-06_COMANECI-GRAPHS_01-resized-v-bd5855.mp4'),
    ('/uploads/duda/75-clinical-publications-0b2a8e.png', '/uploads/duda/75-clinical-publications-640w-9e4cea.png'),
    ('/uploads/duda/Neurovascular-access-2-a125c36a-131a46.png', '/uploads/duda/Neurovascular-access-2-a125c36a-81e412.png'),
    ('/uploads/duda/Neurovascular-access-2-a125c36a-2d1965.png', '/uploads/duda/Neurovascular-access-2-a125c36a-81e412.png'),
    ('/uploads/duda/amPu695aTsE5DvMgsxon_Web---Our-Solutions-banner-v-47b859.mp4', '/uploads/duda/amPu695aTsE5DvMgsxon_Web---Our-Solutions-banner-v-f4ed9a.mp4'),
    ('/uploads/duda/Marie_DoubleTIGER_Case-03ad8f.pdf', '/uploads/duda/Marie_DoubleTIGER_Case-fbe468.pdf'),
    ('/uploads/duda/Meirovitch_T25_first-case-009920.pdf', '/uploads/duda/Meirovitch_T25_first-case-4655bd.pdf'),
    ('/uploads/duda/Solich_T13_case-28d16c.pdf', '/uploads/duda/Solich_T13_case-398e29.pdf'),
    ('/uploads/duda/Brauner_T13_case-084f72.pdf', '/uploads/duda/Brauner_T13_case-fee002.pdf');
  -- only the tables that hold content (as scripts/migrate-media.ts TARGETS), drafts, revisions (a restored version keeps
  -- working) and settings; the audit log, accounts, sessions and the rest keep what they recorded (security review)
  FOR c IN
    SELECT table_name, column_name, data_type FROM information_schema.columns
    WHERE table_schema = 'public' AND data_type IN ('text', 'jsonb')
      AND table_name IN ('solutions', 'materials', 'pages', 'site_pages', 'webinars', 'team_members', 'jobs', 'events',
                         'site_settings', 'setting_drafts', 'drafts', 'revisions', 'publications', 'news_items')
  LOOP
    FOR m IN SELECT f, t FROM dedupe_map LOOP
      EXECUTE format('UPDATE %I SET %I = replace(%I::text, %L, %L)::%s WHERE position(%L in %I::text) > 0',
        c.table_name, c.column_name, c.column_name, m.f, m.t, c.data_type, m.f, c.column_name);
    END LOOP;
  END LOOP;
  UPDATE media o SET alt = d.alt FROM dedupe_map x JOIN media d ON d.url = x.f WHERE o.url = x.t AND o.alt = '' AND d.alt <> '';
  DELETE FROM media WHERE url IN (SELECT f FROM dedupe_map);
END $$;
