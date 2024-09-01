attribute float weightIndex0;

uniform vec4 joints[219];		// 73 joints (4x3 matrix)

void accumulateJointMatrices(out vec4 R0, out vec4 R1, out vec4 R2)
{
	int weightIndex = int(weightIndex0) * 3;
	R0 = joints[weightIndex + 0];
	R1 = joints[weightIndex + 1];
	R2 = joints[weightIndex + 2];
}

#include "shaders/skinning_matrix_common.inc"
