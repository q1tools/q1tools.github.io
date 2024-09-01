void skinningMatrix(vec4 vertexPosition, out vec4 transformedPosition)
{
	vec4 R0, R1, R2;
	
	accumulateJointMatrices(R0, R1, R2);

	// transform vertex
	transformedPosition.x = dot(R0, vertexPosition);
	transformedPosition.y = dot(R1, vertexPosition);
	transformedPosition.z = dot(R2, vertexPosition);
	transformedPosition.w = 1.0;
}

void skinningMatrix(vec4 vertexPosition, out vec4 transformedPosition, vec3 vertexNormal, out vec3 transformedNormal)
{
	vec4 R0, R1, R2;

	accumulateJointMatrices(R0, R1, R2);
	
	// transform vertex
	transformedPosition.x = dot(R0, vertexPosition);
	transformedPosition.y = dot(R1, vertexPosition);
	transformedPosition.z = dot(R2, vertexPosition);
	transformedPosition.w = 1.0;
	
	// transform normal
	transformedNormal.x = dot(R0.xyz, vertexNormal);
	transformedNormal.y = dot(R1.xyz, vertexNormal);
	transformedNormal.z = dot(R2.xyz, vertexNormal);
	
}

void skinningMatrix(vec4 vertexPosition, out vec4 transformedPosition,
                    vec3 vertexNormal, out vec3 transformedNormal,
		    vec4 vertexTangent, out vec3 transformedTangent,
		    out vec3 transformedBiTangent)
{
	vec4 R0, R1, R2;

	accumulateJointMatrices(R0, R1, R2);

	// transform vertex
	transformedPosition.x = dot(R0, vertexPosition);
	transformedPosition.y = dot(R1, vertexPosition);
	transformedPosition.z = dot(R2, vertexPosition);
	transformedPosition.w = 1.0;

	// transform normal
	transformedNormal.x = dot(R0.xyz, vertexNormal);
	transformedNormal.y = dot(R1.xyz, vertexNormal);
	transformedNormal.z = dot(R2.xyz, vertexNormal);
	
	// transform tangent
	transformedTangent.x = dot(R0.xyz, vertexTangent.xyz);
	transformedTangent.y = dot(R1.xyz, vertexTangent.xyz);
	transformedTangent.z = dot(R2.xyz, vertexTangent.xyz);
		
	// derive bitangent
	transformedBiTangent = cross(transformedNormal, transformedTangent);
	transformedBiTangent = transformedBiTangent * vertexTangent.w;
}