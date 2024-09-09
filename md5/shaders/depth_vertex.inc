attribute vec3 pos;

uniform mat4 modelViewProjectionMatrix;

void main()
{
    vec4 localVertex;

#ifdef HW_SKINNING
    skinningMatrix(vec4(pos, 1.0), localVertex);
#else
    localVertex = vec4(pos.xyz, 1.0);
#endif

    gl_Position = modelViewProjectionMatrix * localVertex;
}