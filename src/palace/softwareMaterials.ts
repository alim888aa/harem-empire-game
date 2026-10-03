import * as THREE from 'three';

/** Cheap, explicitly approximate lighting for CPU/SVG navigation QA. No PBR claim. */
export function applySoftwareMaterials(scene:THREE.Scene) {
  const replacements=new Map<THREE.Material,THREE.MeshBasicMaterial>();
  const direction=new THREE.Vector3(-.4,.8,.5).normalize(),normal=new THREE.Vector3();
  scene.updateMatrixWorld(true);
  scene.traverse(object=>{
    if(!(object instanceof THREE.Mesh))return;
    const normals=object.geometry.getAttribute('normal');
    if(normals){
      const shades=new Float32Array(normals.count*3),matrix=new THREE.Matrix3().getNormalMatrix(object.matrixWorld);
      for(let i=0;i<normals.count;i++){
        normal.fromBufferAttribute(normals,i).applyMatrix3(matrix).normalize();
        const shade=.55+.45*Math.max(0,normal.dot(direction));shades[i*3]=shades[i*3+1]=shades[i*3+2]=shade;
      }
      object.geometry.setAttribute('color',new THREE.BufferAttribute(shades,3));
    }
    const convert=(original:THREE.Material)=>{
      let mat=replacements.get(original);
      if(!mat){const source=original as THREE.MeshStandardMaterial;mat=new THREE.MeshBasicMaterial({color:source.color||'#cccccc',side:original.side,vertexColors:true,transparent:original.transparent,opacity:original.opacity});replacements.set(original,mat);}
      return mat;
    };
    object.material=Array.isArray(object.material)?object.material.map(convert):convert(object.material);
  });
  return ()=>replacements.forEach(material=>material.dispose());
}
