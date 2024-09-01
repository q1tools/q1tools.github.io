#ifdef GL_ES
precision mediump float;
#endif
varying vec2 v2f_texCoord;
varying vec3 v2f_lightVector;
varying vec3 v2f_halfAngleVector;
varying vec3 v2f_lightFallOff;

uniform sampler2D diffuseMap;
uniform sampler2D bumpMap;
uniform sampler2D specularMap;
uniform float specularExponent;
uniform vec3 lightColor;
uniform float lightFallOffExponent;

void main() {
    vec3 L = normalize(v2f_lightVector);
	
    float A = 1.0 - min(dot(v2f_lightFallOff, v2f_lightFallOff), 1.0);
    A = pow(A, lightFallOffExponent);

    vec3 Cl = lightColor.xyz * A;
    if (Cl == vec3(0.0))
        discard;
 
    vec3 N = normalize(texture2D(bumpMap, v2f_texCoord).xyz * 2.0 - 1.0);
    float NdotL = dot(N, L);

    vec4 diffuseColor = texture2D(diffuseMap, v2f_texCoord);

#ifdef HALF_LAMBERT_DIFFUSE
    float halfLambert = NdotL * 0.5 + 0.5;
    halfLambert *= halfLambert;
    vec3 Cd = diffuseColor.xyz * halfLambert;
#else
    vec3 Cd = diffuseColor.xyz * max(NdotL, 0.0);
#endif

    vec3 H = normalize(v2f_halfAngleVector);
    float NdotH = max(dot(N, H), 0.0);
		
    vec3 specularColor = texture2D(specularMap, v2f_texCoord).xyz;
    vec3 Cs = specularColor * pow((NdotL > 0.0 ? NdotH : 0.0), specularExponent);

    vec3 C = Cd + Cs;

    gl_FragColor = vec4(Cl * C, diffuseColor.w);
}