precision mediump float;

uniform sampler2D ink;
uniform sampler2D state;
uniform vec2 state_size;
uniform vec4 background_color;

const float COLOR_MIN = 0.2;
const float COLOR_MAX = 0.4;

void main()
{
    vec2 surface_texcoord = gl_FragCoord.xy / state_size;
    vec2 chemicals = texture2D(state, surface_texcoord).xy;
    float chemical_b = chemicals.y;
    chemical_b = clamp(chemical_b, COLOR_MIN, COLOR_MAX);
    float value = (chemical_b - COLOR_MIN) / (COLOR_MAX - COLOR_MIN);
    vec3 ink_color = texture2D(ink, surface_texcoord).xyz;
    gl_FragColor = vec4(mix(background_color.rgb, ink_color, value), 1.0);
}