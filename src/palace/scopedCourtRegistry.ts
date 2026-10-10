// Reviewed exact-name courtier assets. Unknown names retain the legacy fallback path.
// The Emperor and player rank outfits are separate assets.
export interface ScopedCourtSpec {
  readonly file: string;
  readonly labelHeight: number;
  readonly walkSpeed: number;
  readonly normalizeClipOrigin?: boolean;
  readonly runSpeed?: number;
  readonly controlWalk?: number;
  readonly bodyRadius?: number;
  readonly height?: number;
}

export const SCOPED_COURT_MODELS: Readonly<Record<string, ScopedCourtSpec>> = Object.freeze({
  "Prince Feng": {
    "file": "/models/scoped-t3/anime-prince-feng-90440f404f28f764.glb?v=90440f404f28f764",
    "labelHeight": 2.08,
    "walkSpeed": 1.2,
    "runSpeed": 3.8,
    "controlWalk": 1.35,
    "bodyRadius": 0.36,
    "height": 1.9
  },
  "Prince Han": {
    "file": "/models/scoped-t3/anime-prince-han-30fe380214c9b797.glb?v=30fe380214c9b797",
    "labelHeight": 2.08,
    "walkSpeed": 1.2,
    "runSpeed": 3.8,
    "controlWalk": 1.35,
    "bodyRadius": 0.36,
    "height": 1.9
  },
  "Prince Jun": {
    "file": "/models/scoped-t3/anime-prince-jun-bf2ca995541e47dd.glb?v=bf2ca995541e47dd",
    "labelHeight": 2.08,
    "walkSpeed": 1.2,
    "runSpeed": 3.8,
    "controlWalk": 1.35,
    "bodyRadius": 0.36,
    "height": 1.9
  },
  "Prince Lei": {
    "file": "/models/scoped-t3/anime-prince-lei-88ba5f4bcc1d6adb.glb?v=88ba5f4bcc1d6adb",
    "labelHeight": 2.08,
    "walkSpeed": 1.2,
    "runSpeed": 3.8,
    "controlWalk": 1.35,
    "bodyRadius": 0.36,
    "height": 1.9
  },
  "Minister Chen": {
    "file": "/models/scoped-t3/anime-minister-chen-60ee0f25d0f0e554.glb?v=60ee0f25d0f0e554",
    "labelHeight": 2.1,
    "walkSpeed": 1.2
  },
  "Concubine Mei": {
    "file": "/models/scoped-t2/anime-concubine-mei-d0c39967a8b1b807.glb?v=d0c39967a8b1b807",
    "labelHeight": 2.1,
    "walkSpeed": 0.902234637,
    "normalizeClipOrigin": true
  },
  "Concubine Lin": {
    "file": "/models/scoped-t2/anime-concubine-lin-simple-492fbb821f4e8488.glb?v=492fbb821f4e8488",
    "labelHeight": 2.1,
    "walkSpeed": 0.902234637,
    "normalizeClipOrigin": true
  },
  "Concubine Xia": {
    "file": "/models/scoped-t2/anime-concubine-xia-simple-e9dfe7a779b25fb7.glb?v=e9dfe7a779b25fb7",
    "labelHeight": 2.1,
    "walkSpeed": 0.902234637,
    "normalizeClipOrigin": true
  },
  "Concubine Yun": {
    "file": "/models/scoped-t2/anime-concubine-yun-simple-794373daf5827ed4.glb?v=794373daf5827ed4",
    "labelHeight": 2.1,
    "walkSpeed": 0.902234637,
    "normalizeClipOrigin": true
  },
  "Maid Ling": {
    "file": "/models/scoped-t1/anime-maid-ling-7a1a4b84a21d7d9c.glb?v=7a1a4b84a21d7d9c",
    "labelHeight": 2.02,
    "walkSpeed": 0.902234637,
    "normalizeClipOrigin": true
  },
  "Maid Su": {
    "file": "/models/scoped-t1/anime-maid-su-253ed6c3c66621e0.glb?v=253ed6c3c66621e0",
    "labelHeight": 2.02,
    "walkSpeed": 0.902234637,
    "normalizeClipOrigin": true
  },
  "Maid Bai": {
    "file": "/models/scoped-t1/anime-maid-bai-6b8736f8ab14ec84.glb?v=6b8736f8ab14ec84",
    "labelHeight": 2.02,
    "walkSpeed": 0.902234637,
    "normalizeClipOrigin": true
  },
  "Maid Lan": {
    "file": "/models/scoped-t1/anime-maid-lan-ea84dafd8091f167.glb?v=ea84dafd8091f167",
    "labelHeight": 2.02,
    "walkSpeed": 0.902234637,
    "normalizeClipOrigin": true
  },
  "Maid Ting": {
    "file": "/models/scoped-t1/anime-maid-ting-479a7cf9214137ee.glb?v=479a7cf9214137ee",
    "labelHeight": 2.02,
    "walkSpeed": 0.902234637,
    "normalizeClipOrigin": true
  },
  "Maid He": {
    "file": "/models/scoped-t1/anime-maid-he-bf60ca57c3be5561.glb?v=bf60ca57c3be5561",
    "labelHeight": 2.02,
    "walkSpeed": 0.902234637,
    "normalizeClipOrigin": true
  },
  "Maid Rou": {
    "file": "/models/scoped-t1/anime-maid-rou-b44ac0c1de4058fb.glb?v=b44ac0c1de4058fb",
    "labelHeight": 2.02,
    "walkSpeed": 0.902234637,
    "normalizeClipOrigin": true
  },
  "Maid Zhu": {
    "file": "/models/scoped-t1/anime-maid-zhu-5712505462507a37.glb?v=5712505462507a37",
    "labelHeight": 2.02,
    "walkSpeed": 0.902234637,
    "normalizeClipOrigin": true
  },
  "Eunuch Gao": {
    "file": "/models/scoped-t1/anime-eunuch-gao-22e45b76c52caec0.glb?v=22e45b76c52caec0",
    "labelHeight": 2.1,
    "walkSpeed": 1.2
  },
  "Eunuch Lu": {
    "file": "/models/scoped-t1/anime-eunuch-lu-d52735798dbcccf6.glb?v=d52735798dbcccf6",
    "labelHeight": 2.1,
    "walkSpeed": 1.2
  },
  "Eunuch Ren": {
    "file": "/models/scoped-t1/anime-eunuch-ren-a0b38064e308891d.glb?v=a0b38064e308891d",
    "labelHeight": 2.1,
    "walkSpeed": 1.2
  },
  "Eunuch Min": {
    "file": "/models/scoped-t1/anime-eunuch-min-2f89d439a5c4b469.glb?v=2f89d439a5c4b469",
    "labelHeight": 2.1,
    "walkSpeed": 1.2
  },
  "Eunuch Jin": {
    "file": "/models/scoped-t1/anime-eunuch-jin-6be9b7125e9eeedb.glb?v=6be9b7125e9eeedb",
    "labelHeight": 2.1,
    "walkSpeed": 1.2
  },
  "Eunuch Bo": {
    "file": "/models/scoped-t1/anime-eunuch-bo-45da4181e01b9f37.glb?v=45da4181e01b9f37",
    "labelHeight": 2.1,
    "walkSpeed": 1.2
  },
  "Eunuch Tian": {
    "file": "/models/scoped-t1/anime-eunuch-tian-b5dac086d8381dba.glb?v=b5dac086d8381dba",
    "labelHeight": 2.1,
    "walkSpeed": 1.2
  },
  "Eunuch Shu": {
    "file": "/models/scoped-t1/anime-eunuch-shu-83afdfc797b552ad.glb?v=83afdfc797b552ad",
    "labelHeight": 2.1,
    "walkSpeed": 1.2
  },
  "Concubine An": {
    "file": "/models/scoped-t2/anime-concubine-an-simple-23868f6495d257b2.glb?v=23868f6495d257b2",
    "labelHeight": 2.1,
    "walkSpeed": 0.902234637,
    "normalizeClipOrigin": true
  },
  "Concubine Qiao": {
    "file": "/models/scoped-t2/anime-concubine-qiao-simple-765cee9cbec853bc.glb?v=765cee9cbec853bc",
    "labelHeight": 2.1,
    "walkSpeed": 0.902234637,
    "normalizeClipOrigin": true
  },
  "Scholar Qin": {
    "file": "/models/scoped-t2/anime-scholar-qin-3a1b0f4504044de5.glb?v=3a1b0f4504044de5",
    "labelHeight": 2.1,
    "walkSpeed": 1.2
  },
  "Scholar Tao": {
    "file": "/models/scoped-t2/anime-scholar-tao-cf742af125edc091.glb?v=cf742af125edc091",
    "labelHeight": 2.1,
    "walkSpeed": 1.2
  },
  "Scholar Jia": {
    "file": "/models/scoped-t2/anime-scholar-jia-dd91de695726cf5f.glb?v=dd91de695726cf5f",
    "labelHeight": 2.1,
    "walkSpeed": 1.2
  },
  "Scholar Ren": {
    "file": "/models/scoped-t2/anime-scholar-ren-34e491ba870cda23.glb?v=34e491ba870cda23",
    "labelHeight": 2.1,
    "walkSpeed": 1.2
  },
  "Scholar Song": {
    "file": "/models/scoped-t2/anime-scholar-song-177da4b050e0ebb8.glb?v=177da4b050e0ebb8",
    "labelHeight": 2.1,
    "walkSpeed": 1.2
  },
  "Scholar Yu": {
    "file": "/models/scoped-t2/anime-scholar-yu-d95e37117c5d88e8.glb?v=d95e37117c5d88e8",
    "labelHeight": 2.1,
    "walkSpeed": 1.2
  },
  "Consort Hua": {
    "file": "/models/scoped-t3/anime-consort-hua-4c654c8f5ebceba5.glb?v=4c654c8f5ebceba5",
    "labelHeight": 2.1,
    "walkSpeed": 0.902234637,
    "normalizeClipOrigin": true
  },
  "Consort Zhen": {
    "file": "/models/scoped-t3/anime-consort-zhen-956777ba55d373d1.glb?v=956777ba55d373d1",
    "labelHeight": 2.1,
    "walkSpeed": 0.902234637,
    "normalizeClipOrigin": true
  },
  "Consort Rong": {
    "file": "/models/scoped-t3/anime-consort-rong-df8e2d4bf8f18a67.glb?v=df8e2d4bf8f18a67",
    "labelHeight": 2.1,
    "walkSpeed": 0.902234637,
    "normalizeClipOrigin": true
  },
  "Consort Yue": {
    "file": "/models/scoped-t3/anime-consort-yue-38a35c66f0c11f8c.glb?v=38a35c66f0c11f8c",
    "labelHeight": 2.1,
    "walkSpeed": 0.902234637,
    "normalizeClipOrigin": true
  },
  "General Zhao": {
    "file": "/models/scoped-t3/anime-general-zhao-e30c036ff3ff257b.glb?v=e30c036ff3ff257b",
    "labelHeight": 2.1,
    "walkSpeed": 1.2
  },
  "Minister Wang": {
    "file": "/models/scoped-t3/anime-minister-wang-b06d43ea1c6466d2.glb?v=b06d43ea1c6466d2",
    "labelHeight": 2.1,
    "walkSpeed": 1.2
  },
  "Minister Liu": {
    "file": "/models/scoped-t3/anime-minister-liu-7ca6f02e202892a9.glb?v=7ca6f02e202892a9",
    "labelHeight": 2.1,
    "walkSpeed": 1.2
  },
  "Minister Zhang": {
    "file": "/models/scoped-t3/anime-minister-zhang-273d89d123d593c5.glb?v=273d89d123d593c5",
    "labelHeight": 2.1,
    "walkSpeed": 1.2
  },
  "General Shen": {
    "file": "/models/scoped-t3/anime-general-shen-5566ee5e1495ffdb.glb?v=5566ee5e1495ffdb",
    "labelHeight": 2.1,
    "walkSpeed": 1.2
  },
  "General Wei": {
    "file": "/models/scoped-t3/anime-general-wei-5322d95d64d408af.glb?v=5322d95d64d408af",
    "labelHeight": 2.1,
    "walkSpeed": 1.2
  },
  "General Luo": {
    "file": "/models/scoped-t3/anime-general-luo-3d49ad5601d425ef.glb?v=3d49ad5601d425ef",
    "labelHeight": 2.1,
    "walkSpeed": 1.2
  },
  "Crown Prince": {
    "file": "/models/scoped-t4/anime-crown-prince-00197e287f3a8520.glb?v=00197e287f3a8520",
    "labelHeight": 2.12,
    "walkSpeed": 1.2
  },
  "Prime Minister": {
    "file": "/models/scoped-t4/anime-prime-minister-fcefcf10118cc65b.glb?v=fcefcf10118cc65b",
    "labelHeight": 2.12,
    "walkSpeed": 1.2
  },
  "Empress Consort": {
    "file": "/models/scoped-t4/anime-empress-consort-3bd570bc62a2895e.glb?v=3bd570bc62a2895e",
    "labelHeight": 2.24,
    "walkSpeed": 1.2
  },
  "Empress Dowager": {
    "file": "/models/scoped-t4/anime-empress-dowager-5beb1638297e4ff1.glb?v=5beb1638297e4ff1",
    "labelHeight": 2.04,
    "walkSpeed": 1.2
  }
} as const);

export function scopedCourtModelSpec(name: string): ScopedCourtSpec | undefined {
  return Object.hasOwn(SCOPED_COURT_MODELS, name) ? SCOPED_COURT_MODELS[name] : undefined;
}
