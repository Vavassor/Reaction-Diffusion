precision mediump float;
uniform sampler2D state;
uniform vec2 state_size;
uniform vec3 color_a;
uniform vec3 color_b;

const float COLOR_MIN = 0.2;
const float COLOR_MAX = 0.4;

void main()
{
    float chemical_b = texture2D(state, gl_FragCoord.xy / state_size).y;
    chemical_b = clamp(chemical_b, COLOR_MIN, COLOR_MAX);
    float value = (chemical_b - COLOR_MIN) / (COLOR_MAX - COLOR_MIN);
    gl_FragColor = vec4(mix(color_a, color_b, value), 1.0);
}