attribute vec4 weightIndex0;
attribute vec4 weightValue0;

uniform vec4 joints[219];		// 73 joints (4x3 matrix)

void accumulateJointMatrices(out vec4 R0, out vec4 R1, out vec4 R2)
{
	int weightIndex = int(weightIndex0.x) * 3;
	R0 = weightValue0.x * joints[weightIndex + 0];
	R1 = weightValue0.x * joints[weightIndex + 1];
	R2 = weightValue0.x * joints[weightIndex + 2];

	weightIndex = int(weightIndex0.y) * 3;
	R0 += weightValue0.y * joints[weightIndex + 0];
	R1 += weightValue0.y * joints[weightIndex + 1];
	R2 += weightValue0.y * joints[weightIndex + 2];

	weightIndex = int(weightIndex0.z) * 3;
	R0 += weightValue0.z * joints[weightIndex + 0];
	R1 += weightValue0.z * joints[weightIndex + 1];
	R2 += weightValue0.z * joints[weightIndex + 2];

	weightIndex = int(weightIndex0.w) * 3;
	R0 += weightValue0.w * joints[weightIndex + 0];
	R1 += weightValue0.w * joints[weightIndex + 1];
	R2 += weightValue0.w * joints[weightIndex + 2];
}

#include "shaders/skinning_matrix_common.inc"