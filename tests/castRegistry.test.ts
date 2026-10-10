// Owns exact-name cast asset contracts and unchanged court/player routes.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { initialCharacters } from '../src/data/characters';
import { characterAssetUrls, playerMovementSpeeds } from '../src/palace/characterModels';
import { EMPEROR_ASSET_URL } from '../src/palace/palaceAssets';
import { SCOPED_COURT_MODELS, scopedCourtModelSpec } from '../src/palace/scopedCourtRegistry';
type CastGlb = {
    skins: Array<{
        joints: number[];
    }>;
    animations: Array<{
        name: string;
    }>;
    materials: Array<{
        name: string;
        extensions?: Record<string, unknown>;
        pbrMetallicRoughness?: { baseColorTexture?: unknown };
    }>;
    images: unknown[];
    nodes: Array<{
        extras: Record<string, unknown>;
    }>;
};
function glb(url: string): CastGlb {
    const file = new URL('../public' + url.split('?')[0], import.meta.url);
    assert.ok(existsSync(file), url);
    const bytes = readFileSync(file);
    assert.equal(bytes.readUInt32LE(0), 0x46546c67);
    assert.equal(bytes.readUInt32LE(8), bytes.length);
    const jsonLength = bytes.readUInt32LE(12);
    const data = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString()) as CastGlb;
    const hash = createHash('sha256').update(bytes).digest('hex');
    assert.ok(hash.startsWith(url.split('v=')[1]), 'cache fingerprint matches actual source');
    return data;
}
test('all48 courtiers resolve to unique reviewed exact-name models', () => {
    const urls = new Set<string>();
    for (const p of initialCharacters) {
        assert.ok(scopedCourtModelSpec(p.name), p.name);
        const list = characterAssetUrls([p], 'none');
        assert.equal(list.length, 1, p.name);
        urls.add(list[0]);
    }
    assert.equal(Object.keys(SCOPED_COURT_MODELS).length, 48);
    assert.equal(urls.size, 48);
    for (const url of urls) {
        const model = glb(url);
        assert.ok(model.skins?.length >= 1);
        for (const name of ['Idle', 'Walk', 'Gift'])
            assert.ok(model.animations.some(animation => animation.name.includes(name)), `${url}/${name}`);
        if (Object.values(SCOPED_COURT_MODELS).some(s => s.file === url)) {
            const faceRole = url.includes('anime-empress-consort-')
                ? 'Revised_Consort_Skin'
                : url.includes('anime-empress-dowager-') ? 'Revised_Dowager_Skin' : 'Face_00';
            for (const role of [faceRole, 'FaceBrow'])
                assert.ok(model.materials.some(material => material.name.includes(role)), `${url}/${role}`);
            assert.ok(model.materials.some(material => /EyeIris|Mature_Iris/.test(material.name)), url + '/iris');
            const maid = url.includes('anime-maid-');
            const concubine = url.includes('anime-concubine-');
            const consort = url.includes('anime-consort-');
            const general = url.includes('anime-general-');
            const female = maid || concubine || consort;
            assert.equal(model.skins[0].joints.length, female ? 63 : 59);
            assert.deepEqual(model.animations.map(animation => animation.name), female ? ['Idle', 'Walk', 'Gift_Present'] : [
                'Idle', 'Walk', 'Run', 'Gift_Present',
            ]);
            const twelveImages = url.includes('anime-eunuch-')
                || (general && url !== SCOPED_COURT_MODELS['General Wei'].file);
            const empressImages = url.includes('anime-empress-consort-')
                ? 10 : url.includes('anime-empress-dowager-') ? 27 : undefined;
            assert.equal(model.images.length, empressImages ?? (maid ? 13 : concubine ? 14 : twelveImages ? 12 : 11));
        }
        else
            assert.ok(model.materials.some(material => /painted.?face/i.test(material.name) || /Painted_Face/.test(material.name)), url);
    }
});
test('eight scoped Maids use reviewed authored-bob hair and exact per-name cache hashes', () => {
    assert.deepEqual(Object.keys(SCOPED_COURT_MODELS).filter(name => name.startsWith('Maid ')), [
        'Maid Ling', 'Maid Su', 'Maid Bai', 'Maid Lan', 'Maid Ting', 'Maid He', 'Maid Rou', 'Maid Zhu'
    ]);
    assert.equal(characterAssetUrls([{
            name: 'Maid Ling',
        }], 'none')[0], '/models/scoped-t1/anime-maid-ling-7a1a4b84a21d7d9c.glb?v=7a1a4b84a21d7d9c');
    for (const name of [
        'Maid Ling ', 'maid ling', 'Maid Unknown', '__proto__', 'constructor', 'toString'
    ])
        assert.equal(scopedCourtModelSpec(name), undefined, name);
    const expected: Record<string, string> = {
        'Maid Su': '253ed6c3c66621e0',
        'Maid Bai': '6b8736f8ab14ec84',
        'Maid Lan': 'ea84dafd8091f167',
        'Maid Ting': '479a7cf9214137ee',
        'Maid He': 'bf60ca57c3be5561',
        'Maid Rou': 'b44ac0c1de4058fb',
        'Maid Zhu': '5712505462507a37'
    };
    for (const [name, hash] of Object.entries(expected)) {
        const slug = name.toLowerCase().replace(' ', '-');
        assert.equal(characterAssetUrls([{
                name
            }], 'none')[0], `/models/scoped-t1/anime-${slug}-${hash}.glb?v=${hash}`);
    }
    for (const p of initialCharacters.filter(p => (
        !p.name.startsWith('Maid ') && !p.name.startsWith('Eunuch ')
        && !p.name.startsWith('Scholar ') && !p.name.startsWith('Concubine ') && ![
        'Crown Prince', 'Prime Minister', 'Empress Consort', 'Empress Dowager', 'Prince Feng', 'Minister Chen', 'Minister Wang', 'Minister Liu', 'Minister Zhang', 'Consort Rong', 'General Zhao', 'General Shen', 'General Wei', 'General Luo', 'Prince Han', 'Prince Jun', 'Prince Lei',
        'Consort Hua', 'Consort Zhen', 'Consort Yue'
    ].includes(p.name))))
        assert.ok(!characterAssetUrls([p], 'none')[0].includes('/scoped-'), p.name);
});
test('eight reviewed Eunuchs preserve exact identity,59-joint four-clip files and unshifted source clocks', () => {
    const expected: Record<string, string> = {
        "Eunuch Gao": "22e45b76c52caec0",
        "Eunuch Lu": "d52735798dbcccf6",
        "Eunuch Ren": "a0b38064e308891d",
        "Eunuch Min": "2f89d439a5c4b469",
        "Eunuch Jin": "6be9b7125e9eeedb",
        "Eunuch Bo": "45da4181e01b9f37",
        "Eunuch Tian": "b5dac086d8381dba",
        "Eunuch Shu": "83afdfc797b552ad"
    };
    assert.deepEqual(Object.keys(SCOPED_COURT_MODELS).filter(name => name.startsWith('Eunuch ')), Object.keys(expected));
    for (const [name, hash] of Object.entries(expected)) {
        const slug = name.toLowerCase().replace(' ', '-');
        const spec = scopedCourtModelSpec(name)!;
        assert.equal(spec.file, `/models/scoped-t1/anime-${slug}-${hash}.glb?v=${hash}`);
        assert.equal(spec.walkSpeed, 1.2);
        assert.equal(spec.labelHeight, 2.1);
        assert.equal(spec.normalizeClipOrigin ?? false, false);
    }
    for (const name of ['Eunuch Gao ', 'eunuch gao', 'Eunuch Unknown'])
        assert.equal(scopedCourtModelSpec(name), undefined);
});
test('six reviewed Scholars use own59 identities and canonical simple cloth-palette assets', () => {
    const expected: Record<string, string> = {
        "Scholar Qin": "3a1b0f4504044de5",
        "Scholar Tao": "cf742af125edc091",
        "Scholar Jia": "dd91de695726cf5f",
        "Scholar Ren": "34e491ba870cda23",
        "Scholar Song": "177da4b050e0ebb8",
        "Scholar Yu": "d95e37117c5d88e8"
    };
    assert.deepEqual(Object.keys(SCOPED_COURT_MODELS).filter(name => name.startsWith('Scholar ')), Object.keys(expected));
    for (const [name, hash] of Object.entries(expected)) {
        const slug = name.toLowerCase().replace(' ', '-');
        const spec = scopedCourtModelSpec(name)!;
        assert.equal(spec.file, `/models/scoped-t2/anime-${slug}-${hash}.glb?v=${hash}`);
        assert.equal(spec.walkSpeed, 1.2);
        assert.equal(spec.labelHeight, 2.1);
        assert.equal(spec.normalizeClipOrigin ?? false, false);
    }
    for (const name of ['Scholar Qin ', 'scholar qin', 'Scholar Unknown'])
        assert.equal(scopedCourtModelSpec(name), undefined);
});
test('reviewed Concubine Mei retains own63 calibration and exact three-clip identity asset', () => {
    const spec = scopedCourtModelSpec('Concubine Mei')!;
    assert.equal(spec.file, '/models/scoped-t2/anime-concubine-mei-d0c39967a8b1b807.glb?v=d0c39967a8b1b807');
    assert.equal(spec.labelHeight, 2.1);
    assert.equal(spec.walkSpeed, .902234637);
    assert.equal(spec.normalizeClipOrigin, true);
    const model = glb(spec.file);
    assert.equal(model.skins[0].joints.length, 63);
    assert.deepEqual(model.animations.map(animation => animation.name), ['Idle', 'Walk', 'Gift_Present']);
    for (const name of ['Concubine Mei ', 'concubine mei', 'Concubine Unknown'])
        assert.equal(scopedCourtModelSpec(name), undefined);
});
test('all9 player rank outfits have all7 articulated clips and consistent controller speeds', () => {
    const urls = new Set<string>();
    const careers = [
        ['prince', [null, 'grand_prince', 'crown_prince']],
        ['minister', [null, 'minister', 'prime_minister']],
        ['concubine', [null, 'consort', 'empress']],
    ] as const;
    for (const [role, ranks] of careers) {
        assert.equal(playerMovementSpeeds(role).walk, 1.35);
        assert.equal(playerMovementSpeeds(role).run, 3.8);
        for (const rank of ranks) {
            const list = characterAssetUrls([], role, rank);
            assert.equal(list.length, 1);
            urls.add(list[0]);
            const model = glb(list[0]);
            for (const name of [
                'Idle', 'Walk', 'Run', 'Gift_Present', 'Jump_Start', 'Jump_Air', 'Land',
            ])
                assert.ok(model.animations.some(animation => animation.name === name));
            assert.ok(model.skins?.length);
        }
    }
    assert.equal(urls.size, 9);
    assert.equal(characterAssetUrls([], 'concubine', 'empress_consort')[0], characterAssetUrls([], 'concubine', 'empress')[0]);
});
test('Emperor keeps its dedicated encounter contract and is not an ordinary courtier registry entry', () => {
    const model = glb(EMPEROR_ASSET_URL);
    assert.deepEqual(model.animations.map(animation => animation.name), ['Imperial_Idle', 'Imperial_Approach']);
    assert.equal(characterAssetUrls([{ name: 'Emperor' }], 'none').length, 0);
    assert.equal(model.skins[0].joints.length, 57);
    for (const name of ['Genuine native head | deep crown shadow', 'Deep eye-socket shadow fill']) {
        const material = model.materials.find(candidate => candidate.name === name);
        assert.ok(material, name);
        assert.ok(material.extensions && Object.hasOwn(material.extensions, 'KHR_materials_unlit'), name);
        assert.equal(material.pbrMetallicRoughness?.baseColorTexture, undefined, name);
    }
});
test('Mei portable metadata preserves all published v38 binary chunks', () => {
    const spec = scopedCourtModelSpec('Concubine Mei')!;
    const file = new URL('../public' + spec.file.split('?')[0], import.meta.url);
    const bytes = readFileSync(file);
    const jsonEnd = 20 + bytes.readUInt32LE(12);
    const model = glb(spec.file);
    assert.equal(model.nodes[65].extras.source_native_shoulder_basis, undefined);
    assert.equal(
        createHash('sha256').update(bytes.subarray(jsonEnd)).digest('hex'),
        'add0824d7793dd4e6c8b4c865d783192251c9b46378c430bac09e2c14b65f00c',
    );
});
test('five SIMPLE Concubines retain exact own63 identities, fitted sashes and unchanged motion calibration', () => {
    const expected: Record<string, string> = {
        "Concubine Lin": "492fbb821f4e8488",
        "Concubine Xia": "e9dfe7a779b25fb7",
        "Concubine Yun": "794373daf5827ed4",
        "Concubine An": "23868f6495d257b2",
        "Concubine Qiao": "765cee9cbec853bc"
    };
    for (const [name, hash] of Object.entries(expected)) {
        const slug = name.toLowerCase().replace(' ', '-');
        const spec = scopedCourtModelSpec(name)!;
        assert.equal(spec.file, `/models/scoped-t2/anime-${slug}-simple-${hash}.glb?v=${hash}`);
        assert.equal(spec.walkSpeed, .902234637);
        assert.equal(spec.labelHeight, 2.1);
        assert.equal(spec.normalizeClipOrigin, true);
        const model = glb(spec.file);
        assert.equal(model.skins[0].joints.length, 63);
        assert.deepEqual(model.animations.map(animation => animation.name), ['Idle', 'Walk', 'Gift_Present']);
        assert.equal(model.images.length, 14);
    }
    for (const name of [
        'Concubine Lin ', 'concubine lin', 'Concubine Unknown', 'Consort Hua '
    ])
        assert.equal(scopedCourtModelSpec(name), undefined);
});
test('exact named Feng,Chen and three custom princes retain own59 four-clip identities and baseline fields', () => {
    const feng = scopedCourtModelSpec('Prince Feng')!;
    assert.deepEqual(feng, {
        file: '/models/scoped-t3/anime-prince-feng-90440f404f28f764.glb?v=90440f404f28f764',
        labelHeight: 2.08,
        walkSpeed: 1.2,
        runSpeed: 3.8,
        controlWalk: 1.35,
        bodyRadius: .36,
        height: 1.9
    });
    const chen = scopedCourtModelSpec('Minister Chen')!;
    assert.deepEqual(chen, {
        file: '/models/scoped-t3/anime-minister-chen-60ee0f25d0f0e554.glb?v=60ee0f25d0f0e554', labelHeight: 2.1, walkSpeed: 1.2,
    });
    const customPrinces = {
        'Prince Han': '30fe380214c9b7974a89218a80093c96b9c453bdf9a80d10389e34c59206479f',
        'Prince Jun': 'bf2ca995541e47dd6935ca56a33cdc657798ef5938f85497ab0d770b81d94ef3',
        'Prince Lei': '88ba5f4bcc1d6adb66c35f74d70cdac624a3fe223b1a3e85609e0c759af8a5e8',
    };
    const princeSpecs = Object.entries(customPrinces).map(([name, hash]) => {
        const slug = name.toLowerCase().replace(' ', '-');
        const file = `/models/scoped-t3/anime-${slug}-${hash.slice(0, 16)}.glb?v=${hash.slice(0, 16)}`;
        const spec = scopedCourtModelSpec(name)!;
        assert.deepEqual(spec, { ...feng, file });
        assert.deepEqual(characterAssetUrls([{ name }], 'none'), [file]);
        const path = new URL('../public' + file.split('?')[0], import.meta.url);
        assert.equal(createHash('sha256').update(readFileSync(path)).digest('hex'), hash);
        return spec;
    });
    for (const name of ['Prince Han ', 'prince han', 'Prince Jun ', 'prince jun', 'Prince Lei ', 'prince lei']) {
        assert.equal(scopedCourtModelSpec(name), undefined, name);
    }
    for (const spec of [feng, chen, ...princeSpecs]) {
        const model = glb(spec.file);
        assert.equal(model.skins[0].joints.length, 59);
        assert.deepEqual(model.animations.map(animation => animation.name), [
            'Idle', 'Walk', 'Run', 'Gift_Present',
        ]);
        assert.equal(model.images.length, 11);
    }
    for (const name of [
        'Prince Feng ', 'prince feng', 'Minister Chen ', 'minister chen', 'Prince Unknown', 'Minister Unknown'
    ])
        assert.equal(scopedCourtModelSpec(name), undefined, name);
});
test('exact Rong,Zhao and three custom Consorts preserve public route, complete spec, runtime hash, own rig and clips', () => {
    const actors = [
        {
            name: 'Consort Rong', hash: 'df8e2d4bf8f18a67788f682d8578b2f134f60142af52f445664c6f643b8ae11a',
            spec: {
                file: '/models/scoped-t3/anime-consort-rong-df8e2d4bf8f18a67.glb?v=df8e2d4bf8f18a67',
                labelHeight: 2.1, walkSpeed: .902234637, normalizeClipOrigin: true
            },
            ownBones: 63, images: 11, clips: ['Idle', 'Walk', 'Gift_Present']
        },
        {
            name: 'General Zhao', hash: 'e30c036ff3ff257b362da14d5f747d818f724040c5370b80dbc111700364675e',
            spec: {
                file: '/models/scoped-t3/anime-general-zhao-e30c036ff3ff257b.glb?v=e30c036ff3ff257b', labelHeight: 2.1, walkSpeed: 1.2,
            },
            ownBones: 59, images: 12, clips: [
                'Idle', 'Walk', 'Run', 'Gift_Present',
            ]
        },
        {
            name: 'Consort Hua', hash: '4c654c8f5ebceba5ef65d97e2e4f812e99796e29c53efec2685d6af030bfbd49',
            spec: {
                file: '/models/scoped-t3/anime-consort-hua-4c654c8f5ebceba5.glb?v=4c654c8f5ebceba5',
                labelHeight: 2.1, walkSpeed: .902234637, normalizeClipOrigin: true
            },
            ownBones: 63, images: 11, clips: ['Idle', 'Walk', 'Gift_Present']
        },
        {
            name: 'Consort Zhen', hash: '956777ba55d373d11e16bdcf3940010b280cb42a3a3d1bdb2f3caa097732f381',
            spec: {
                file: '/models/scoped-t3/anime-consort-zhen-956777ba55d373d1.glb?v=956777ba55d373d1',
                labelHeight: 2.1, walkSpeed: .902234637, normalizeClipOrigin: true
            },
            ownBones: 63, images: 11, clips: ['Idle', 'Walk', 'Gift_Present']
        },
        {
            name: 'Consort Yue', hash: '38a35c66f0c11f8c5574c6bb15fb84c6f72e98a11d8538ec7bbb809871a18f07',
            spec: {
                file: '/models/scoped-t3/anime-consort-yue-38a35c66f0c11f8c.glb?v=38a35c66f0c11f8c',
                labelHeight: 2.1, walkSpeed: .902234637, normalizeClipOrigin: true
            },
            ownBones: 63, images: 11, clips: ['Idle', 'Walk', 'Gift_Present']
        }
    ];
    for (const actor of actors) {
        const spec = scopedCourtModelSpec(actor.name)!;
        assert.deepEqual(spec, actor.spec);
        assert.equal(Object.hasOwn(spec, 'runSpeed'), false);
        assert.deepEqual(characterAssetUrls([{
                name: actor.name
            }], 'none'), [actor.spec.file]);
        const file = new URL('../public' + actor.spec.file.split('?')[0], import.meta.url);
        assert.equal(createHash('sha256').update(readFileSync(file)).digest('hex'), actor.hash);
        const model = glb(actor.spec.file);
        assert.equal(model.skins[0].joints.length, actor.ownBones);
        assert.deepEqual(model.animations.map(animation => animation.name), actor.clips);
        assert.equal(model.images.length, actor.images);
    }
    for (const name of [
        'Consort Rong ', 'consort rong', 'General Zhao ', 'general zhao', 'General Unknown', 'Consort Hua ', 'consort hua', 'Consort Zhen ', 'consort zhen', 'Consort Yue ', 'consort yue'
    ]) {
        assert.equal(scopedCourtModelSpec(name), undefined, name);
    }
});

test('six custom Minister and General models retain exact reviewed per-name routes', () => {
    const expected = {
    "Minister Wang": "/models/scoped-t3/anime-minister-wang-b06d43ea1c6466d2.glb?v=b06d43ea1c6466d2",
    "Minister Liu": "/models/scoped-t3/anime-minister-liu-7ca6f02e202892a9.glb?v=7ca6f02e202892a9",
    "Minister Zhang": "/models/scoped-t3/anime-minister-zhang-273d89d123d593c5.glb?v=273d89d123d593c5",
    "General Shen": "/models/scoped-t3/anime-general-shen-5566ee5e1495ffdb.glb?v=5566ee5e1495ffdb",
    "General Wei": "/models/scoped-t3/anime-general-wei-5322d95d64d408af.glb?v=5322d95d64d408af",
    "General Luo": "/models/scoped-t3/anime-general-luo-3d49ad5601d425ef.glb?v=3d49ad5601d425ef"
};
    for (const [name, url] of Object.entries(expected)) {
        assert.deepEqual(scopedCourtModelSpec(name), { file: url, labelHeight: 2.1, walkSpeed: 1.2 });
        assert.deepEqual(characterAssetUrls([{ name }], 'none'), [url]);
        const model = glb(url);
        assert.equal(model.skins[0].joints.length, 59);
        assert.deepEqual(model.animations.map(clip => clip.name), ['Idle', 'Walk', 'Run', 'Gift_Present']);
        assert.equal(model.images.length, name.startsWith('General ') && name !== 'General Wei' ? 12 : 11);
        assert.equal(scopedCourtModelSpec(name + ' '), undefined);
        assert.equal(scopedCourtModelSpec(name.toLowerCase()), undefined);
    }
});

test('four royal costumes retain exact reviewed names and own59 motion libraries', () => {
    const expected = {
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
};
    for (const [name, spec] of Object.entries(expected)) {
        assert.deepEqual(scopedCourtModelSpec(name), spec);
        assert.deepEqual(characterAssetUrls([{ name }], 'none'), [spec.file]);
        const model = glb(spec.file);
        assert.equal(model.skins[0].joints.length, 59);
        assert.deepEqual(model.animations.map(clip => clip.name), ['Idle', 'Walk', 'Run', 'Gift_Present']);
        assert.equal(scopedCourtModelSpec(name + ' '), undefined);
        assert.equal(scopedCourtModelSpec(name.toLowerCase()), undefined);
    }
});
