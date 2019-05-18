precision mediump float;

uniform sampler2D state;
uniform sampler2D style_map;
uniform vec2 state_size;
uniform float canvas_feed_rate;
uniform float canvas_kill_rate;
uniform float flow_rate;
uniform bool apply_style_map;

const vec2 diffusion = vec2(1.0, 0.5);
const float tau = 6.28318530718;
const float TIMESTEP = 1.0;

void main()
{
    vec2 center = gl_FragCoord.xy;
    vec2 north = center + vec2(0.0, 1.0);
    vec2 northeast = center + vec2(1.0, 1.0);
    vec2 east = center + vec2(1.0, 0.0);
    vec2 southeast = center + vec2(1.0, -1.0);
    vec2 south = center + vec2(0.0, -1.0);
    vec2 southwest = center + vec2(-1.0, -1.0);
    vec2 west = center + vec2(-1.0, 0.0);
    vec2 northwest = center + vec2(-1.0, 1.0);

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
    vec2 laplacian = 0.05 * flow_rate * (texture2D(state, northeast / state_size).xy
            + flow_rate * texture2D(state, southeast / state_size).xy
            + flow_rate * texture2D(state, southwest / state_size).xy
            + flow_rate * texture2D(state, northwest / state_size).xy)
            + 0.2 * flow_rate * (texture2D(state, north / state_size).xy
            + flow_rate * texture2D(state, east / state_size).xy
            + flow_rate * texture2D(state, south / state_size).xy
            + flow_rate * texture2D(state, west / state_size).xy)
            - value;
    float reaction = value.x * value.y * value.y;

    vec2 delta;
    delta.x = (diffusion.x * laplacian.x) - reaction + (feed_rate * (1.0 - value.x));
    delta.y = (diffusion.y * laplacian.y) + reaction - (value.y * (kill_rate + feed_rate));

    gl_FragColor = vec4((delta * TIMESTEP) + value, 0.0, 0.0);
}