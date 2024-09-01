varying vec2 v2f_texCoord;
varying vec3 v2f_lightVector;
varying vec3 v2f_halfAngleVector;
varying vec3 v2f_lightFallOff;

attribute vec3 pos;
attribute vec2 texCoord;
attribute vec3 normal;
attribute vec4 tangent;

uniform mat4 modelViewProjectionMatrix;
uniform vec3 localViewOrigin;
uniform mat3 localLightAxis;
uniform vec4 localLightOrigin; // if w component is 1, light type is directional
uniform vec3 lightInvRadius;

void main()
{
    vec4 localVertex;
    vec3 localNormal;
    vec3 localTangent;
    vec3 localBiTangent;

#ifdef HW_SKINNING
    skinningMatrix(vec4(pos, 1.0), localVertex, normal, localNormal, tangent, localTangent, localBiTangent);
#else
    localVertex = vec4(pos, 1.0);
    localNormal = normal;
    localTangent = tangent.xyz;
    localBiTangent = normalize(cross(normal.xyz, tangent.xyz) * tangent.w);
#endif

    v2f_texCoord = texCoord;

    vec3 L = localLightOrigin.xyz + (localLightOrigin.w - 1.0) * localVertex.xyz;
    vec3 V = localViewOrigin.xyz - localVertex.xyz;

    v2f_lightFallOff = L * lightInvRadius;

    mat3 TBN = mat3(localTangent, localBiTangent, localNormal);
    v2f_lightVector = L * TBN;

    vec3 H = normalize(L) + normalize(V);
    v2f_halfAngleVector = H * TBN;

    gl_Position = modelViewProjectionMatrix * localVertex;
}