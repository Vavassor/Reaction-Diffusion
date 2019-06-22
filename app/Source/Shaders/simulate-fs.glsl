precision mediump float;

uniform sampler2D state;
uniform sampler2D style_map;
uniform sampler2D orientation_map;
uniform vec2 state_size;
uniform float canvas_feed_rate;
uniform float canvas_kill_rate;
uniform float flow_rate;
uniform bool apply_orientation_map;
uniform bool apply_style_map;

const vec2 diffusion = vec2(0.2, 0.1);
const float tau = 6.28318530718;
const float TIMESTEP = 1.0;

void main()
{
    vec2 center = gl_FragCoord.xy;

    float feed_rate;
    float kill_rate;
    if(apply_style_map)
    {
        vec2 rates = texture2D(style_map, center / state_size).xy;
        kill_rate = (0.09 * rates.x) + 0.01;
        feed_rate = (0.025 * rates.y) + 0.045;
    }
    else
    {
        feed_rate = canvas_feed_rate;
        kill_rate = canvas_kill_rate;
    }

    vec2 value = texture2D(state, center / state_size).xy;
    vec2 northeast = texture2D(state, (center + vec2(1.0, 1.0)) / state_size).xy;
    vec2 southeast = texture2D(state, (center + vec2(1.0, -1.0)) / state_size).xy;
    vec2 southwest = texture2D(state, (center + vec2(-1.0, -1.0)) / state_size).xy;
    vec2 northwest = texture2D(state, (center + vec2(-1.0, 1.0)) / state_size).xy;
    vec2 north = texture2D(state, (center + vec2(0.0, 1.0)) / state_size).xy;
    vec2 east = texture2D(state, (center + vec2(1.0, 0.0)) / state_size).xy;
    vec2 south = texture2D(state, (center + vec2(0.0, -1.0)) / state_size).xy;
    vec2 west = texture2D(state, (center + vec2(-1.0, 0.0)) / state_size).xy;

    float dxx;
    float dxy;
    float dyy;
    if(apply_orientation_map)
    {
        vec2 scale = vec2(0.7, 0.2);
        vec2 direction = 2.0 * texture2D(orientation_map, center / state_size).xy - 1.0;
        float direction_length = length(direction);
        if (direction_length == 0.0)
        {
            direction = vec2(0.0, 0.0);
        }
        else
        {
            direction /= direction_length;
        }
        
        float cos_angle = direction.x;
        float sin_angle = direction.y;
        
        dxx = scale.x * (cos_angle * cos_angle) + scale.y * (sin_angle * sin_angle);
        dxy = (scale.y - scale.x) * (cos_angle * sin_angle);
        dyy = scale.y * (cos_angle * cos_angle) + scale.x * (sin_angle * sin_angle);
    }
    else
    {
        dxx = 0.5;
        dxy = 0.0;
        dyy = 0.5;
    }

    float da = diffusion.x * flow_rate;
    float db = diffusion.y * flow_rate;
    
    vec3 du_mat1 = da * vec3(-dxy, 2.0 * dyy, dxy);
    vec3 du_mat2 = vec3(2.0 * dxx * da, diffusion.x * -4.0 * (dxx + dyy), 2.0 * dxx * da);
    vec3 du_mat3 = da * vec3(dxy, 2.0 * dyy, -dxy);

    vec3 dv_mat1 = db * vec3(-dxy, 2.0 * dyy, dxy);
    vec3 dv_mat2 = vec3(2.0 * dxx * db, diffusion.y * -4.0 * (dxx + dyy), 2.0 * dxx * db);
    vec3 dv_mat3 = db * vec3(dxy, 2.0 * dyy, -dxy);

    vec3 u_mat1 = vec3(northwest.x, north.x, northeast.x);
    vec3 u_mat2 = vec3(west.x, value.x, east.x);
    vec3 u_mat3 = vec3(southwest.x, south.x, southeast.x);

    vec3 v_mat1 = vec3(northwest.y, north.y, northeast.y);
    vec3 v_mat2 = vec3(west.y, value.y, east.y);
    vec3 v_mat3 = vec3(southwest.y, south.y, southeast.y);

    vec2 laplacian;
    laplacian.x = dot(u_mat1, du_mat1) + dot(u_mat2, du_mat2) + dot(u_mat3, du_mat3);
    laplacian.y = dot(v_mat1, dv_mat1) + dot(v_mat2, dv_mat2) + dot(v_mat3, dv_mat3);
    float reaction = value.x * value.y * value.y;

    vec2 delta;
    delta.x = laplacian.x - reaction + (feed_rate * (1.0 - value.x));
    delta.y = laplacian.y + reaction - (value.y * (kill_rate + feed_rate));

    gl_FragColor = vec4((delta * TIMESTEP) + value, 0.0, 0.0);
}