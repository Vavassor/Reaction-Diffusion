precision mediump float;

uniform sampler2D ink;
uniform vec2 texture_size;

varying vec2 surface_texcoord;

const float diffusion = 0.05;
const float flow_rate = 1.0;
const float TIMESTEP = 1.0;

vec4 diffuse(vec2 center, vec2 texel_size)
{
    vec4 value = texture2D(ink, center);
    vec4 northeast = texture2D(ink, center + texel_size * vec2(1.0, 1.0));
    vec4 southeast = texture2D(ink, center + texel_size * vec2(1.0, -1.0));
    vec4 southwest = texture2D(ink, center + texel_size * vec2(-1.0, -1.0));
    vec4 northwest = texture2D(ink, center + texel_size * vec2(-1.0, 1.0));
    vec4 north = texture2D(ink, center + texel_size * vec2(0.0, 1.0));
    vec4 east = texture2D(ink, center + texel_size * vec2(1.0, 0.0));
    vec4 south = texture2D(ink, center + texel_size * vec2(0.0, -1.0));
    vec4 west = texture2D(ink, center + texel_size * vec2(-1.0, 0.0));

    float db = diffusion * flow_rate;

    float dxx = 0.5;
    float dxy = 0.0;
    float dyy = 0.5;

    vec3 dv_mat1 = db * vec3(-dxy, 2.0 * dyy, dxy);
    vec3 dv_mat2 = vec3(2.0 * dxx * db, diffusion * -4.0 * (dxx + dyy), 2.0 * dxx * db);
    vec3 dv_mat3 = db * vec3(dxy, 2.0 * dyy, -dxy);

    vec4 top = (dv_mat1.x * northwest) + (dv_mat1.y * north) + (dv_mat1.z * northeast);
    vec4 middle = (dv_mat2.x * west) + (dv_mat2.y * value) + (dv_mat2.z * east);
    vec4 bottom = (dv_mat3.x * southwest) + (dv_mat3.y * south) + (dv_mat3.z * southeast);
    vec4 sum = top + middle + bottom;

    return value + sum;
}

void main()
{
    vec2 texel_size = 1.0 / texture_size;

    gl_FragColor = diffuse(surface_texcoord, texel_size);
}