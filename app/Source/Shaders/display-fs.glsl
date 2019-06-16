precision mediump float;

uniform sampler2D ink;
uniform sampler2D state;
uniform vec2 state_size;

const float COLOR_MIN = 0.2;
const float COLOR_MAX = 0.4;

void main()
{
    float chemical_b = texture2D(state, gl_FragCoord.xy / state_size).y;
    chemical_b = clamp(chemical_b, COLOR_MIN, COLOR_MAX);
    float value = (chemical_b - COLOR_MIN) / (COLOR_MAX - COLOR_MIN);
    vec3 inkColor = texture2D(ink, gl_FragCoord.xy / state_size).xyz;
    gl_FragColor = vec4(inkColor * value, 1.0);
}